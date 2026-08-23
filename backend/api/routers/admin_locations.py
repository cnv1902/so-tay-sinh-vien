from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from db.models import Location
from api.schemas.admin_schema import LocationCreate, LocationUpdate, LocationResponse
from db.connection import get_db
from api.utils import extract_lat_lng

router = APIRouter(tags=["Admin Locations"])

@router.get("/locations", response_model=List[LocationResponse])
async def get_all(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Location).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/locations/{item_id}", response_model=LocationResponse)
async def get_by_id(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(Location, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.post("/locations", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_item(item_in: LocationCreate, db: AsyncSession = Depends(get_db)):
    data = item_in.model_dump()
    if data.get("map_link"):
        lat, lng = await extract_lat_lng(data["map_link"])
        data["latitude"] = lat
        data["longitude"] = lng
        
    item = Location(**data)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.put("/locations/{item_id}", response_model=LocationResponse)
async def update_item(item_id: int, item_in: LocationUpdate, db: AsyncSession = Depends(get_db)):
    item = await db.get(Location, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_in.model_dump(exclude_unset=True)
    if "map_link" in update_data and update_data["map_link"]:
        lat, lng = await extract_lat_lng(update_data["map_link"])
        update_data["latitude"] = lat
        update_data["longitude"] = lng

    for key, value in update_data.items():
        setattr(item, key, value)
        
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/locations/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(Location, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    await db.commit()
    return None
