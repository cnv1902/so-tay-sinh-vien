from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from db.models import EmergencyContact, EmergencyTemplate
from api.schemas.admin_schema import (
    EmergencyContactCreate, EmergencyContactUpdate, EmergencyContactResponse,
    EmergencyTemplateCreate, EmergencyTemplateUpdate, EmergencyTemplateResponse,
    MapLinkRequest
)
from db.connection import get_db
import httpx
import re

router = APIRouter(tags=["Admin Emergency"])

@router.post("/emergency/extract-map-link")
async def extract_map_link(request: MapLinkRequest):
    url = request.url
    if not url.startswith("http"):
        url = "https://" + url

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
            response = await client.get(url)
            final_url = str(response.url)
            
            # 1. ƯU TIÊN 1: Tìm Vĩ độ ở !3d và Kinh độ ở !4d (Tọa độ chính xác của Place)
            match_3d4d = re.search(r'!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)', final_url)
            if match_3d4d:
                lat, lng = match_3d4d.groups()
                return {"latitude": float(lat), "longitude": float(lng)}
            
            # 2. ƯU TIÊN 2 (Fallback): Tìm sau chữ @ (Thường là tọa độ tâm màn hình, thả ghim tự do)
            match_at = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', final_url)
            if match_at:
                lat, lng = match_at.groups()
                return {"latitude": float(lat), "longitude": float(lng)}
            
            raise HTTPException(status_code=400, detail="Không tìm thấy tọa độ từ URL này.")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=400, detail=f"Lỗi khi truy cập URL: {exc}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi không xác định: {e}")

# --- CONTACTS ---
@router.get("/emergency/contacts", response_model=List[EmergencyContactResponse])
async def get_contacts(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EmergencyContact).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/emergency/contacts/{contact_id}", response_model=EmergencyContactResponse)
async def get_contact(contact_id: int, db: AsyncSession = Depends(get_db)):
    contact = await db.get(EmergencyContact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

@router.post("/emergency/contacts", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(contact_in: EmergencyContactCreate, db: AsyncSession = Depends(get_db)):
    contact = EmergencyContact(**contact_in.model_dump())
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact

@router.put("/emergency/contacts/{contact_id}", response_model=EmergencyContactResponse)
async def update_contact(contact_id: int, contact_in: EmergencyContactUpdate, db: AsyncSession = Depends(get_db)):
    contact = await db.get(EmergencyContact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    update_data = contact_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(contact, key, value)
        
    await db.commit()
    await db.refresh(contact)
    return contact

@router.delete("/emergency/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(contact_id: int, db: AsyncSession = Depends(get_db)):
    contact = await db.get(EmergencyContact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    await db.delete(contact)
    await db.commit()
    return None

# --- TEMPLATES ---
@router.get("/emergency/templates", response_model=List[EmergencyTemplateResponse])
async def get_templates(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EmergencyTemplate).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/emergency/templates/{template_id}", response_model=EmergencyTemplateResponse)
async def get_template(template_id: int, db: AsyncSession = Depends(get_db)):
    template = await db.get(EmergencyTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.post("/emergency/templates", response_model=EmergencyTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(template_in: EmergencyTemplateCreate, db: AsyncSession = Depends(get_db)):
    template = EmergencyTemplate(**template_in.model_dump())
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template

@router.put("/emergency/templates/{template_id}", response_model=EmergencyTemplateResponse)
async def update_template(template_id: int, template_in: EmergencyTemplateUpdate, db: AsyncSession = Depends(get_db)):
    template = await db.get(EmergencyTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = template_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)
        
    await db.commit()
    await db.refresh(template)
    return template

@router.delete("/emergency/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(template_id: int, db: AsyncSession = Depends(get_db)):
    template = await db.get(EmergencyTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    await db.delete(template)
    await db.commit()
    return None
