from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from db.models import News
from api.schemas.admin_schema import NewsCreate, NewsUpdate, NewsResponse
from db.connection import get_db

router = APIRouter(tags=["Admin News"])

@router.get("/news", response_model=List[NewsResponse])
async def get_all(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(News).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/news/{item_id}", response_model=NewsResponse)
async def get_by_id(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(News, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.post("/news", response_model=NewsResponse, status_code=status.HTTP_201_CREATED)
async def create_item(item_in: NewsCreate, db: AsyncSession = Depends(get_db)):
    item = News(**item_in.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.put("/news/{item_id}", response_model=NewsResponse)
async def update_item(item_id: int, item_in: NewsUpdate, db: AsyncSession = Depends(get_db)):
    item = await db.get(News, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
        
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/news/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(News, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    await db.commit()
    return None
