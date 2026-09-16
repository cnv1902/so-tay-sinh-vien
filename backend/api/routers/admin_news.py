from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from db.models import News
from api.schemas.admin_schema import NewsCreate, NewsUpdate, NewsResponse
from db.connection import get_db
from core.translator import translate_to_en_and_lao

router = APIRouter(tags=["Admin News"])

def _format_news(item: News, lang: str = "vi") -> NewsResponse:
    title = item.title
    content = item.content
    if lang == "en":
        title = item.title_en or item.title
        content = item.content_en or item.content
    elif lang == "lo":
        title = item.title_lao or item.title
        content = item.content_lao or item.content

    return NewsResponse(
        id=item.id,
        title=title,
        title_en=item.title_en,
        title_lao=item.title_lao,
        content=content,
        content_en=item.content_en,
        content_lao=item.content_lao,
        image_url=item.image_url,
        is_pinned=item.is_pinned,
        author_id=item.author_id,
        created_at=item.created_at,
    )

@router.get("/news", response_model=List[NewsResponse])
async def get_all(
    skip: int = 0, 
    limit: int = 100, 
    lang: Optional[str] = Query("vi", description="Ngôn ngữ: vi, en, lo"),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(News).order_by(News.is_pinned.desc(), News.created_at.desc()).offset(skip).limit(limit))
    items = result.scalars().all()
    return [_format_news(i, lang) for i in items]

@router.get("/news/{item_id}", response_model=NewsResponse)
async def get_by_id(
    item_id: int, 
    lang: Optional[str] = Query("vi", description="Ngôn ngữ: vi, en, lo"),
    db: AsyncSession = Depends(get_db)
):
    item = await db.get(News, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return _format_news(item, lang)

@router.post("/news", response_model=NewsResponse, status_code=status.HTTP_201_CREATED)
async def create_item(item_in: NewsCreate, db: AsyncSession = Depends(get_db)):
    data = item_in.model_dump()
    
    # Tự động dịch sang EN và LAO nếu chưa có
    if not data.get("title_en") and data.get("title"):
        t_en, t_lao = translate_to_en_and_lao(data["title"])
        data["title_en"] = t_en
        data["title_lao"] = t_lao

    if not data.get("content_en") and data.get("content"):
        c_en, c_lao = translate_to_en_and_lao(data["content"])
        data["content_en"] = c_en
        data["content_lao"] = c_lao

    item = News(**data)
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
    if "title" in update_data and update_data["title"] and not update_data.get("title_en"):
        t_en, t_lao = translate_to_en_and_lao(update_data["title"])
        update_data["title_en"] = t_en
        update_data["title_lao"] = t_lao

    if "content" in update_data and update_data["content"] and not update_data.get("content_en"):
        c_en, c_lao = translate_to_en_and_lao(update_data["content"])
        update_data["content_en"] = c_en
        update_data["content_lao"] = c_lao

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

