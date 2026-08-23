import logging
import asyncio
from typing import List, Dict
from qdrant_client import models as qmodels

from core.embedder import embed
from core.vectordb import upsert_points
from db.connection import AsyncSessionLocal
from db.models import UploadedDocument, DocumentChunk
from sqlalchemy import select

logger = logging.getLogger(__name__)

async def approve_and_embed_chunks(doc_id: int, approved_chunks: List[Dict]):
    """
    approved_chunks: List of dicts, e.g. [{"chunk_id": 1, "content": "edited content"}]
    """
    logger.info(f"[QdrantService] Bắt đầu duyệt và embed {len(approved_chunks)} chunks cho document {doc_id}")
    
    try:
        points = []
        async with AsyncSessionLocal() as db:
            doc = await db.get(UploadedDocument, doc_id)
            if not doc:
                raise Exception(f"Không tìm thấy document {doc_id}")

            doc.status = 'embedding'
            await db.commit()

            for chunk_data in approved_chunks:
                chunk_id = chunk_data.get("chunk_id")
                new_content = chunk_data.get("content")
                
                db_chunk = await db.get(DocumentChunk, chunk_id)
                if not db_chunk or db_chunk.document_id != doc_id:
                    continue
                
                # Update DB chunk
                db_chunk.content = new_content
                db_chunk.status = 'approved'
                
                # Create embedding (chạy ở thread để không chặn luồng chính)
                vector = await asyncio.to_thread(embed, new_content)
                
                # Prepare metadata payload
                payload = db_chunk.metadata_payload or {}
                payload['content'] = new_content
                
                # Dùng db_chunk.id làm point id để tránh duplicate khi update
                point = qmodels.PointStruct(
                    id=db_chunk.id,
                    vector={
                        "dense": vector["dense"],
                        "sparse": qmodels.SparseVector(
                            indices=vector["sparse_indices"],
                            values=vector["sparse_values"]
                        )
                    },
                    payload=payload
                )
                points.append(point)
            
            # Đẩy lên Qdrant
            if points:
                await asyncio.to_thread(upsert_points, points)
            
            # Đánh dấu document hoàn tất
            doc.status = 'success'
            await db.commit()
            
            logger.info(f"[QdrantService] Hoàn tất đẩy {len(points)} vectors lên Qdrant cho doc {doc_id}")
            
    except Exception as e:
        logger.error(f"[QdrantService] Lỗi khi approve/embed: {str(e)}", exc_info=True)
        async with AsyncSessionLocal() as db:
            doc = await db.get(UploadedDocument, doc_id)
            if doc:
                doc.status = 'failed'
                doc.error_message = f"Lỗi khi embed Qdrant: {str(e)}"
                await db.commit()
        raise

async def re_embed_document_chunks(doc_id: int):
    """
    Tạo lại vector cho tất cả chunk đã duyệt của document (chạy ngầm).
    Dùng khi đổi tên tài liệu làm thay đổi chuỗi ngữ cảnh.
    """
    logger.info(f"[QdrantService] Bắt đầu re-embed cho document {doc_id}")
    try:
        points = []
        async with AsyncSessionLocal() as db:
            doc = await db.get(UploadedDocument, doc_id)
            if not doc:
                return

            doc.status = 'embedding'
            await db.commit()

            result = await db.execute(select(DocumentChunk).where(DocumentChunk.document_id == doc_id, DocumentChunk.status == 'approved'))
            chunks = result.scalars().all()
            
            for db_chunk in chunks:
                vector = await asyncio.to_thread(embed, db_chunk.content)
                payload = db_chunk.metadata_payload or {}
                payload['content'] = db_chunk.content
                
                point = qmodels.PointStruct(
                    id=db_chunk.id,
                    vector={
                        "dense": vector["dense"],
                        "sparse": qmodels.SparseVector(
                            indices=vector["sparse_indices"],
                            values=vector["sparse_values"]
                        )
                    },
                    payload=payload
                )
                points.append(point)
            
            if points:
                await asyncio.to_thread(upsert_points, points)
            
            doc.status = 'success'
            await db.commit()
            logger.info(f"[QdrantService] Hoàn tất re-embed {len(points)} vectors cho doc {doc_id}")
    except Exception as e:
        logger.error(f"[QdrantService] Lỗi khi re-embed: {str(e)}", exc_info=True)
        async with AsyncSessionLocal() as db:
            doc = await db.get(UploadedDocument, doc_id)
            if doc:
                doc.status = 'failed'
                doc.error_message = f"Lỗi khi re-embed Qdrant: {str(e)}"
                await db.commit()
