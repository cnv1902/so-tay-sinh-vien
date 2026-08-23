from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional

from db.connection import get_db
from db.models import LLMProvider, LLMSlot
from db.crud import upsert_provider, upsert_slot

router = APIRouter(prefix="/admin", tags=["Admin Config"])

class SlotResponse(BaseModel):
    slot: str
    provider: str
    model_name: str

class SlotRequest(BaseModel):
    slot: str
    provider: str
    model_name: str

@router.get("/slots", response_model=List[SlotResponse])
async def get_slots(db: AsyncSession = Depends(get_db)):
    stmt = select(LLMSlot)
    res = await db.execute(stmt)
    slots = res.scalars().all()
    return [{"slot": s.slot, "provider": s.provider, "model_name": s.model_name} for s in slots]

@router.post("/slots")
async def save_slot(req: SlotRequest, db: AsyncSession = Depends(get_db)):
    await upsert_slot(db, req.slot, req.provider, req.model_name)
    return {"message": "Success"}

class ProviderResponse(BaseModel):
    provider: str
    has_key: bool
    endpoint: Optional[str]

class ProviderRequest(BaseModel):
    provider: str
    api_key: Optional[str]
    endpoint: Optional[str]
    is_active: bool

@router.get("/providers", response_model=List[ProviderResponse])
async def get_providers(db: AsyncSession = Depends(get_db)):
    stmt = select(LLMProvider)
    res = await db.execute(stmt)
    providers = res.scalars().all()
    out = []
    for p in providers:
        out.append({
            "provider": p.provider,
            "has_key": bool(p.api_key),
            "endpoint": p.endpoint
        })
    return out

@router.post("/providers")
async def save_provider(req: ProviderRequest, db: AsyncSession = Depends(get_db)):
    # Đảm bảo không xóa API key cũ nếu request gửi rỗng
    if not req.api_key:
        stmt = select(LLMProvider).where(LLMProvider.provider == req.provider)
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()
        if existing:
            req.api_key = existing.api_key
    await upsert_provider(db, req.provider, req.api_key, req.endpoint, req.is_active)
    return {"message": "Success"}

import httpx

@router.get("/models/{provider_id}")
async def get_models(provider_id: str, db: AsyncSession = Depends(get_db)):
    if provider_id == "vllm":
        return {"models": []}
        
    stmt = select(LLMProvider).where(LLMProvider.provider == provider_id)
    res = await db.execute(stmt)
    provider_config = res.scalar_one_or_none()
    
    if not provider_config or not provider_config.api_key:
        raise HTTPException(status_code=400, detail=f"Vui lòng thiết lập API Key cho {provider_id.upper()} trước khi lấy danh sách model.")
        
    api_key = provider_config.api_key
    models = []
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if provider_id == "gemini":
                # Lấy danh sách model từ Google AI Studio
                resp = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}")
                resp.raise_for_status()
                data = resp.json()
                for m in data.get("models", []):
                    # Chỉ lấy các model hỗ trợ sinh text (generateContent)
                    if "generateContent" in m.get("supportedGenerationMethods", []):
                        name = m.get("name", "").replace("models/", "")
                        models.append(name)
                        
            elif provider_id == "openai":
                # Lấy danh sách model từ OpenAI
                resp = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {api_key}"}
                )
                resp.raise_for_status()
                data = resp.json()
                for m in data.get("data", []):
                    m_id = m.get("id", "")
                    # Lọc bớt các model rác, chỉ giữ gpt hoặc chat model chính
                    if "gpt" in m_id or m_id.startswith("o1") or m_id.startswith("o3"):
                        models.append(m_id)
                models.sort()
                
            elif provider_id == "groq":
                # Lấy danh sách model từ Groq
                resp = await client.get(
                    "https://api.groq.com/openai/v1/models",
                    headers={"Authorization": f"Bearer {api_key}"}
                )
                resp.raise_for_status()
                data = resp.json()
                for m in data.get("data", []):
                    models.append(m.get("id", ""))
                models.sort()
                
    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        error_text = e.response.text
        raise HTTPException(status_code=400, detail=f"API Key không hợp lệ hoặc bị từ chối ({status}): {error_text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không thể kết nối đến {provider_id.upper()}: {str(e)}")

    return {"models": models}
