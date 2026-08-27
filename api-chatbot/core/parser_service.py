"""
core/parser_service.py
======================
Simplified 3-Layer RAG Document Ingestion Pipeline.

Layer 1 — Convert:
  - All files (.pdf, .docx, .txt) are converted to Markdown using MarkItDown.

Layer 2 — Chunking:
  - MarkdownHeaderSplitter + RecursiveCharacterTextSplitter.

Layer 3 — Context Injection:
  - Breadcrumb: [Tài liệu: X | Năm phát hành: Y | Danh mục: Z | Mục: W]
"""
import asyncio
import logging
import re
from pathlib import Path
from typing import Optional



from markitdown import MarkItDown
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from db.connection import AsyncSessionLocal
from db.models import UploadedDocument, DocumentChunk
from indexing.translator import translate_to_en_and_lao

logger = logging.getLogger(__name__)

DOC_TYPE_LABELS: dict[str, str] = {
    "de_an":        "Đề án tuyển sinh",
    "quy_che":      "Quy chế tuyển sinh",
    "diem_chuan":   "Điểm chuẩn",
    "huong_dan":    "Hướng dẫn tuyển sinh",
    "hoc_phi":      "Học phí",
    "lich_su":      "Lịch sử truyền thống",
    "gioi_thieu":   "Giới thiệu chung",
    "co_so_vat_chat": "Cơ sở vật chất & KTX",
    "thanh_tich":   "Thành tích & Việc làm",
    "doi_song":     "Đời sống sinh viên",
    "khac":         "Khác",
}

# ---------------------------------------------------------------------------
# LAYER 1 — CONVERTER
# ---------------------------------------------------------------------------

_markitdown_converter = MarkItDown()

def _convert_to_markdown(file_path: str) -> str:
    """Sử dụng MarkItDown để chuyển đổi mọi định dạng sang Markdown."""
    result = _markitdown_converter.convert(file_path)
    return result.text_content or ""

# ---------------------------------------------------------------------------
# LAYER 2 — CHUNKING
# ---------------------------------------------------------------------------

def normalize_fake_headings(md_content: str) -> str:
    """Tiền xử lý văn bản: Un-escape ký tự và sửa lỗi tiêu đề giả."""
    if not md_content:
        return ""
    md_content = md_content.replace(r'\*\*', '**')
    md_content = re.sub(r'^(\\#+)\s+', lambda m: m.group(1).replace('\\', '') + ' ', md_content, flags=re.MULTILINE)
    
    def replacer(match):
        content = match.group(1).strip()
        if len(content) < 150 and '\n' not in content:
            return f"### {content}"
        return match.group(0)

    md_content = re.sub(r'^\s*\*\*(.*?)\*\*\s*$', replacer, md_content, flags=re.MULTILINE)
    return md_content

def _chunk_prose(
    md_content: str,
    context_header: str,
    year: Optional[int],
    doc_type: str,
    doc_id: int,
) -> list[Document]:
    """Cắt văn bản với MarkdownHeaderSplitter + RecursiveCharacterTextSplitter."""
    md_content = normalize_fake_headings(md_content)

    headers_to_split_on = [
        ("#", "Header 1"),
        ("##", "Header 2"),
        ("###", "Header 3"),
    ]
    markdown_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=headers_to_split_on,
        strip_headers=False,
    )
    md_header_splits = markdown_splitter.split_text(md_content)

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
    )
    final_splits = text_splitter.split_documents(md_header_splits)

    result = []
    for chunk in final_splits:
        # Layer 3: Tiêm Context (Context Injection)
        meta = chunk.metadata
        h1 = meta.get("Header 1")
        h2 = meta.get("Header 2")
        h3 = meta.get("Header 3")
        
        sections = [h for h in [h1, h2, h3] if h]
        section_str = " > ".join(sections)
        
        enriched_context = context_header
        if section_str:
            enriched_context = context_header[:-1] + f" | Mục: {section_str}]"
            
        chunk.page_content = f"{enriched_context}\n{chunk.page_content}"
        chunk.metadata.update({
            "year": year,
            "doc_type": doc_type,
            "document_id": doc_id,
            "chunk_type": "prose",
        })
        result.append(chunk)

    return result

# ---------------------------------------------------------------------------
# LAYER 3 — CONTEXT INJECTION (helper)
# ---------------------------------------------------------------------------

def _build_context_header(filename: str, year: int, doc_type: str) -> str:
    """Tạo breadcrumb ngữ cảnh gắn đầu mỗi chunk."""
    label = DOC_TYPE_LABELS.get(doc_type.lower(), doc_type) if doc_type else "Chưa phân loại"
    return f"[Tài liệu: {filename} | Năm phát hành: {year} | Danh mục: {label}]"

# ---------------------------------------------------------------------------
# ENTRY POINT
# ---------------------------------------------------------------------------

async def process_document(doc_id: int, file_path: str, year: int, doc_type: str):
    logger.info(f"[Parser] Bắt đầu xử lý document ID {doc_id} từ {file_path}")

    try:
        # Lấy tên filename từ DB thay vì file_path để hỗ trợ custom_filename
        async with AsyncSessionLocal() as db:
            doc = await db.get(UploadedDocument, doc_id)
            if not doc:
                logger.error(f"[Parser] Không tìm thấy document {doc_id} trong DB")
                return
            filename = doc.filename

        context_header = _build_context_header(filename, year, doc_type)

        # Layer 1: Convert
        logger.info(f"[Parser] Sử dụng MarkItDown cho {filename}")
        md_content = await asyncio.to_thread(_convert_to_markdown, file_path)

        if not md_content or len(md_content.strip()) < 50:
            raise ValueError(
                "Không trích xuất được nội dung. File có thể bị scan (ảnh) "
                "hoặc không đúng định dạng."
            )

        # Layer 2: Chunking
        all_chunks = await asyncio.to_thread(_chunk_prose, md_content, context_header, year, doc_type, doc_id)
        
        logger.info(f"[Parser] Document {doc_id}: tổng {len(all_chunks)} chunks.")

        # Dịch toàn bộ văn bản (full content)
        logger.info(f"[Parser] Dịch tài liệu sang EN và LAO (Background thread)...")
        md_content_en, md_content_lao = await asyncio.to_thread(translate_to_en_and_lao, md_content)

        # Lưu vào PostgreSQL
        async with AsyncSessionLocal() as db:
            doc = await db.get(UploadedDocument, doc_id)
            if not doc:
                logger.error(f"[Parser] Không tìm thấy document {doc_id} trong DB")
                return

            for chunk in all_chunks:
                db_chunk = DocumentChunk(
                    document_id=doc_id,
                    content=chunk.page_content,
                    metadata_payload=chunk.metadata,
                    status="pending",
                )
                db.add(db_chunk)

            doc.full_content = md_content
            doc.full_content_en = md_content_en
            doc.full_content_lao = md_content_lao
            doc.status = "pending_review"
            await db.commit()
            logger.info(f"[Parser] Đã lưu full_content và tạo {len(all_chunks)} chunks cho document {doc_id}. Chờ duyệt.")

    except ValueError as e:
        logger.warning(f"[Parser] Document {doc_id} từ chối: {str(e)}")
        async with AsyncSessionLocal() as db:
            doc = await db.get(UploadedDocument, doc_id)
            if doc:
                doc.status = "failed"
                doc.error_message = str(e)
                await db.commit()

    except Exception as e:
        logger.error(f"[Parser] Lỗi xử lý document {doc_id}: {str(e)}", exc_info=True)
        async with AsyncSessionLocal() as db:
            doc = await db.get(UploadedDocument, doc_id)
            if doc:
                doc.status = "failed"
                doc.error_message = f"Lỗi hệ thống khi phân tích tài liệu: {str(e)}"
                await db.commit()
