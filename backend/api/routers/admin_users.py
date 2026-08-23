from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from db.models import Account
from api.schemas.admin_schema import AccountCreate, AccountUpdate, AccountResponse
from db.connection import get_db
from core.security import get_password_hash

router = APIRouter(tags=["Admin Users"])

@router.get("/users", response_model=List[AccountResponse])
async def get_all(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Account).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/users/{item_id}", response_model=AccountResponse)
async def get_by_id(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(Account, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.post("/users", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_item(item_in: AccountCreate, db: AsyncSession = Depends(get_db)):
    # Hash password trước khi lưu
    item_data = item_in.model_dump()
    if "password" in item_data:
        pwd = item_data.pop("password")
        if pwd:
            item_data["password_hash"] = get_password_hash(pwd)
        
    item = Account(**item_data)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.put("/users/{item_id}", response_model=AccountResponse)
async def update_item(item_id: int, item_in: AccountUpdate, db: AsyncSession = Depends(get_db)):
    item = await db.get(Account, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_in.model_dump(exclude_unset=True)
    if "password" in update_data:
        pwd = update_data.pop("password")
        if pwd:
            update_data["password_hash"] = get_password_hash(pwd)
        
    for key, value in update_data.items():
        setattr(item, key, value)
        
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/users/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(Account, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    await db.commit()
    return None
