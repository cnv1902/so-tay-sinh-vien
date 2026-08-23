from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import extract, or_
from typing import List, Optional

from db.models import CalendarEvent
from api.schemas.admin_schema import CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse
from db.connection import get_db

router = APIRouter(tags=["Admin Calendar"])

@router.get("/calendar", response_model=List[CalendarEventResponse])
async def get_all(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
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

    return events

@router.get("/calendar/{item_id}", response_model=CalendarEventResponse)
async def get_by_id(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(CalendarEvent, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.post("/calendar", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
async def create_item(item_in: CalendarEventCreate, db: AsyncSession = Depends(get_db)):
    item = CalendarEvent(**item_in.model_dump())
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
