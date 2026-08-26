from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import extract, or_
from typing import List, Optional

from db.models import CalendarEvent
from api.schemas.admin_schema import CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse
from db.connection import get_db

from core.translator import translate_to_en_and_lao

router = APIRouter(tags=["Admin Calendar"])

@router.get("/calendar", response_model=List[CalendarEventResponse])
async def get_all(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    lang: Optional[str] = Query("vi"),
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CalendarEvent)
    
    if month is not None and year is not None:
        stmt = stmt.where(
            or_(
                (extract('month', CalendarEvent.start_time) == month) & (extract('year', CalendarEvent.start_time) == year),
                (CalendarEvent.is_annual == True) & (extract('month', CalendarEvent.start_time) == month)
            )
        )
    
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    events = result.scalars().all()
    
    # Virtualize year cho các sự kiện hàng năm
    if year is not None:
        for event in events:
            if event.is_annual:
                try:
                    event.start_time = event.start_time.replace(year=year)
                    event.end_time = event.end_time.replace(year=year)
                except ValueError:
                    # Xử lý trường hợp 29/2 cho các năm không nhuận
                    event.start_time = event.start_time.replace(year=year, day=28)
                    event.end_time = event.end_time.replace(year=year, day=28)

    # Map sang ngôn ngữ tương ứng nếu có yêu cầu
    if lang in ('en', 'lo'):
        for event in events:
            if lang == 'en':
                if event.title_en:
                    event.title = event.title_en
                if event.description_en:
                    event.description = event.description_en
            elif lang == 'lo':
                if event.title_lao:
                    event.title = event.title_lao
                if event.description_lao:
                    event.description = event.description_lao

    return events

@router.get("/calendar/{item_id}", response_model=CalendarEventResponse)
async def get_by_id(item_id: int, lang: Optional[str] = Query("vi"), db: AsyncSession = Depends(get_db)):
    item = await db.get(CalendarEvent, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if lang == 'en':
        if item.title_en:
            item.title = item.title_en
        if item.description_en:
            item.description = item.description_en
    elif lang == 'lo':
        if item.title_lao:
            item.title = item.title_lao
        if item.description_lao:
            item.description = item.description_lao
    return item

@router.post("/calendar", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
async def create_item(item_in: CalendarEventCreate, db: AsyncSession = Depends(get_db)):
    data = item_in.model_dump()
    
    # Tự động dịch sang EN và LO nếu chưa có
    if not data.get("title_en") or not data.get("title_lao"):
        t_en, t_lao = translate_to_en_and_lao(data.get("title"))
        data["title_en"] = data.get("title_en") or t_en
        data["title_lao"] = data.get("title_lao") or t_lao
    if data.get("description") and (not data.get("description_en") or not data.get("description_lao")):
        d_en, d_lao = translate_to_en_and_lao(data.get("description"))
        data["description_en"] = data.get("description_en") or d_en
        data["description_lao"] = data.get("description_lao") or d_lao

    item = CalendarEvent(**data)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.put("/calendar/{item_id}", response_model=CalendarEventResponse)
async def update_item(item_id: int, item_in: CalendarEventUpdate, db: AsyncSession = Depends(get_db)):
    item = await db.get(CalendarEvent, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_in.model_dump(exclude_unset=True)
    
    # Tự động dịch nếu sửa title/description
    if "title" in update_data and ("title_en" not in update_data or "title_lao" not in update_data):
        t_en, t_lao = translate_to_en_and_lao(update_data["title"])
        update_data["title_en"] = update_data.get("title_en") or t_en
        update_data["title_lao"] = update_data.get("title_lao") or t_lao
    if "description" in update_data and update_data["description"] and ("description_en" not in update_data or "description_lao" not in update_data):
        d_en, d_lao = translate_to_en_and_lao(update_data["description"])
        update_data["description_en"] = update_data.get("description_en") or d_en
        update_data["description_lao"] = update_data.get("description_lao") or d_lao

    for key, value in update_data.items():
        setattr(item, key, value)
        
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/calendar/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(CalendarEvent, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    await db.commit()
    return None

