from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from db.models import UploadedDocument
from db.connection import get_db
from core.translator import translate_to_en_and_lao

router = APIRouter(tags=["Admin Documents"])

class DocumentUpdateIn(BaseModel):
    filename: Optional[str] = None
    filename_en: Optional[str] = None
    filename_lao: Optional[str] = None
    year: Optional[int] = None
    doc_type: Optional[str] = None
    full_content: Optional[str] = None
    full_content_en: Optional[str] = None
    full_content_lao: Optional[str] = None
    status: Optional[str] = None

class DocumentCreateIn(BaseModel):
    filename: str
    filename_en: Optional[str] = None
    filename_lao: Optional[str] = None
    year: Optional[int] = None
    doc_type: Optional[str] = 'khac'
    full_content: Optional[str] = None
    full_content_en: Optional[str] = None
    full_content_lao: Optional[str] = None
    status: Optional[str] = 'success'

def format_document(doc: UploadedDocument, lang: str = "vi") -> dict:
    d = {
        "id": doc.id,
        "filename": doc.filename,
        "filename_en": doc.filename_en,
        "filename_lao": doc.filename_lao,
        "year": doc.year,
        "doc_type": doc.doc_type,
        "uploaded_by": doc.uploaded_by,
        "status": doc.status,
        "message": doc.message,
        "error_message": doc.error_message,
        "full_content": doc.full_content,
        "full_content_en": doc.full_content_en,
        "full_content_lao": doc.full_content_lao,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
    }
    if lang == "en":
        d["filename"] = doc.filename_en or doc.filename
        d["full_content"] = doc.full_content_en or doc.full_content
    elif lang == "lo":
        d["filename"] = doc.filename_lao or doc.filename
        d["full_content"] = doc.full_content_lao or doc.full_content
    return d

@router.get("/documents")
async def get_all_documents(
    doc_type: Optional[str] = Query(None, description="Lọc theo loại tài liệu"),
    status: Optional[str] = Query(None, description="Lọc theo trạng thái (ví dụ: success)"),
    lang: Optional[str] = Query('vi', description="Ngôn ngữ hiển thị (vi, en, lo)"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(UploadedDocument)
    if doc_type and doc_type != 'all':
        stmt = stmt.where(UploadedDocument.doc_type == doc_type)
    if status:
        stmt = stmt.where(UploadedDocument.status == status)
    stmt = stmt.order_by(UploadedDocument.created_at.desc())
    result = await db.execute(stmt)
    docs = result.scalars().all()
    return [format_document(d, lang) for d in docs]

@router.get("/documents/{doc_id}")
async def get_document_by_id(
    doc_id: int, 
    lang: Optional[str] = Query('vi', description="Ngôn ngữ hiển thị (vi, en, lo)"),
    db: AsyncSession = Depends(get_db)
):
    doc = await db.get(UploadedDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
    return format_document(doc, lang)

@router.post("/documents", status_code=status.HTTP_201_CREATED)
async def create_document(item_in: DocumentCreateIn, db: AsyncSession = Depends(get_db)):
    data = item_in.model_dump()
    
    # Tự động dịch sang EN và LAO nếu chưa có
    if not data.get("filename_en") and data.get("filename"):
        fn_en, fn_lao = translate_to_en_and_lao(data["filename"])
        data["filename_en"] = fn_en
        data["filename_lao"] = fn_lao

    if not data.get("full_content_en") and data.get("full_content"):
        c_en, c_lao = translate_to_en_and_lao(data["full_content"])
        data["full_content_en"] = c_en
        data["full_content_lao"] = c_lao

    doc = UploadedDocument(**data)
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc

@router.put("/documents/{doc_id}")
async def update_document(doc_id: int, item_in: DocumentUpdateIn, db: AsyncSession = Depends(get_db)):
    doc = await db.get(UploadedDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
    
    update_data = item_in.model_dump(exclude_unset=True)

    # Tự động cập nhật bản dịch nếu sửa tiêu đề hoặc nội dung
    if "filename" in update_data and not update_data.get("filename_en"):
        fn_en, fn_lao = translate_to_en_and_lao(update_data["filename"])
        update_data["filename_en"] = fn_en
        update_data["filename_lao"] = fn_lao

    if "full_content" in update_data and not update_data.get("full_content_en"):
        c_en, c_lao = translate_to_en_and_lao(update_data["full_content"])
        update_data["full_content_en"] = c_en
        update_data["full_content_lao"] = c_lao

    for key, value in update_data.items():
        setattr(doc, key, value)
        
    await db.commit()
    await db.refresh(doc)
    return doc

@router.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(doc_id: int, db: AsyncSession = Depends(get_db)):
    doc = await db.get(UploadedDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
    
    # Xóa vectors liên quan trong Qdrant qua microservice nếu có
    import httpx, os
    llm_url = os.getenv("LLM_SERVICE_URL", "http://api-chatbot:8001")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.delete(f"{llm_url}/api/documents/{doc_id}")
    except Exception:
        pass

    # Xóa bản ghi trong Postgres (nếu microservice chưa xóa)
    try:
        fresh_doc = await db.get(UploadedDocument, doc_id)
        if fresh_doc:
            await db.delete(fresh_doc)
            await db.commit()
    except Exception:
        pass
    return None

