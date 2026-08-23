import logging
import shutil
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from db.connection import get_db
from db.models import UploadedDocument, DocumentChunk, DocTypeEnum
from core.parser_service import process_document
from core.qdrant_service import approve_and_embed_chunks, re_embed_document_chunks

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["Documents"])

_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = _BACKEND_ROOT / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class ChunkApproval(BaseModel):
    chunk_id: int
    content: str

class BulkDeleteChunks(BaseModel):
    chunk_ids: List[int]
    
class RenameDocument(BaseModel):
    new_name: str

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    year: int = Form(...),
    doc_type: str = Form("khac"),
    custom_filename: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Xác thực định dạng file
        allowed_extensions = {".pdf", ".docx", ".txt"}
        ext = Path(file.filename).suffix.lower()
        if ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Định dạng {ext} không được hỗ trợ. Chỉ hỗ trợ .pdf, .docx, .txt"
            )

        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        final_name = custom_filename.strip() if custom_filename and custom_filename.strip() else file.filename
        
        doc = UploadedDocument(
            filename=final_name,
            year=year,
            doc_type=doc_type,
            status="processing"
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)
        
        # Dispatch background task
        background_tasks.add_task(process_document, doc.id, str(file_path), year, doc_type)
        
        return {"message": "Tài liệu đang được xử lý", "document_id": doc.id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Upload] Lỗi khi upload: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Không thể upload file: {str(e)}")

@router.get("")
async def get_documents(
    doc_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(UploadedDocument)
    if doc_type:
        stmt = stmt.where(UploadedDocument.doc_type == doc_type)
    stmt = stmt.order_by(UploadedDocument.created_at.desc())
    result = await db.execute(stmt)
    docs = result.scalars().all()
    return docs

@router.get("/{doc_id}")
async def get_document_by_id(doc_id: int, db: AsyncSession = Depends(get_db)):
    doc = await db.get(UploadedDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
    return doc

import os
from core.vectordb import delete_points_by_document_id

@router.delete("/{doc_id}")
async def delete_document(doc_id: int, db: AsyncSession = Depends(get_db)):
    doc = await db.get(UploadedDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
        
    # Xóa file vật lý
    file_path = os.path.join(UPLOAD_DIR, doc.filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            logger.warning(f"Không thể xóa file vật lý {file_path}: {e}")
            
    # Xóa vectors trong Qdrant
    delete_points_by_document_id(doc_id)
    
    # Xóa document trong Postgres (tự động cascade xóa document_chunks)
    await db.delete(doc)
    await db.commit()
    return {"message": "Đã xóa tài liệu và các chunk liên quan"}

@router.get("/{doc_id}/chunks")
async def get_document_chunks(doc_id: int, db: AsyncSession = Depends(get_db)):
    doc = await db.get(UploadedDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
        
    stmt = select(DocumentChunk).where(
        DocumentChunk.document_id == doc_id,
        DocumentChunk.status == 'pending'
    ).order_by(DocumentChunk.id.asc())
    
    result = await db.execute(stmt)
    chunks = result.scalars().all()
    return chunks

@router.post("/{doc_id}/approve-chunks")
async def approve_chunks(
    doc_id: int,
    payload: List[ChunkApproval],
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    doc = await db.get(UploadedDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
        
    if doc.status != 'pending_review':
        raise HTTPException(status_code=400, detail="Tài liệu không ở trạng thái chờ duyệt")
        
    approved_list = [{"chunk_id": item.chunk_id, "content": item.content} for item in payload]
    
    try:
        # Call Qdrant service to embed and upsert ngầm trong background task
        background_tasks.add_task(approve_and_embed_chunks, doc_id, approved_list)
        return {"message": "Đang tiến hành lưu và nhúng (embed) các chunk vào CSDL..."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{doc_id}/rename")
async def rename_document(
    doc_id: int,
    payload: RenameDocument,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    doc = await db.get(UploadedDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
        
    old_name = doc.filename
    new_name = payload.new_name.strip()
    if not new_name or old_name == new_name:
        return {"message": "Tên không thay đổi"}
        
    doc.filename = new_name
    await db.commit()

    # Cập nhật chuỗi breadcrumb trong tất cả các chunk
    stmt = select(DocumentChunk).where(DocumentChunk.document_id == doc_id)
    result = await db.execute(stmt)
    chunks = result.scalars().all()
    
    for chunk in chunks:
        chunk.content = chunk.content.replace(f"[Tài liệu: {old_name} |", f"[Tài liệu: {new_name} |")
        
    await db.commit()
    
    if doc.status == 'success':
        # Re-embed ngầm dưới nền
        background_tasks.add_task(re_embed_document_chunks, doc_id)
        return {"message": "Đã đổi tên và đang cập nhật lại dữ liệu AI dưới nền..."}
        
    return {"message": "Đã đổi tên tài liệu thành công"}

@router.post("/chunks/delete")
async def delete_chunks(
    payload: BulkDeleteChunks,
    db: AsyncSession = Depends(get_db)
):
    if not payload.chunk_ids:
        return {"message": "Không có chunk nào được chọn"}
        
    # Delete chunks from DB
    from sqlalchemy import delete
    stmt = delete(DocumentChunk).where(DocumentChunk.id.in_(payload.chunk_ids))
    await db.execute(stmt)
    await db.commit()
    
    return {"message": f"Đã xóa {len(payload.chunk_ids)} chunk"}
