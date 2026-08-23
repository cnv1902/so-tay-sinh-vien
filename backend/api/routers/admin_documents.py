from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from db.models import UploadedDocument
from db.connection import get_db

router = APIRouter(tags=["Admin Documents"])

class DocumentUpdateIn(BaseModel):
    filename: Optional[str] = None
    year: Optional[int] = None
    doc_type: Optional[str] = None
    full_content: Optional[str] = None
    status: Optional[str] = None

class DocumentCreateIn(BaseModel):
    filename: str
    year: Optional[int] = None
    doc_type: Optional[str] = 'khac'
    full_content: Optional[str] = None
    status: Optional[str] = 'success'

@router.get("/documents")
async def get_all_documents(
    doc_type: Optional[str] = Query(None, description="Lọc theo loại tài liệu"),
    status: Optional[str] = Query(None, description="Lọc theo trạng thái (ví dụ: success)"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(UploadedDocument)
    if doc_type and doc_type != 'all':
        stmt = stmt.where(UploadedDocument.doc_type == doc_type)
    if status:
        stmt = stmt.where(UploadedDocument.status == status)
    stmt = stmt.order_by(UploadedDocument.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/documents/{doc_id}")
async def get_document_by_id(doc_id: int, db: AsyncSession = Depends(get_db)):
    doc = await db.get(UploadedDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
    return doc

@router.post("/documents", status_code=status.HTTP_201_CREATED)
async def create_document(item_in: DocumentCreateIn, db: AsyncSession = Depends(get_db)):
    doc = UploadedDocument(**item_in.model_dump())
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

