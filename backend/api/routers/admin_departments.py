"""
api/routers/admin_departments.py
================================
CRUD endpoints cho quản lý Tòa nhà (Building) và Phòng ban (Department)
phục vụ bản đồ khuôn viên VinhUni Map và Chatbot RAG Tool.

Endpoints:
  Buildings:
    GET    /buildings            - Danh sách tất cả tòa nhà
    GET    /buildings/{id}       - Chi tiết tòa nhà kèm danh sách phòng ban
    POST   /buildings            - Tạo mới tòa nhà
    PUT    /buildings/{id}       - Cập nhật tòa nhà
    DELETE /buildings/{id}       - Xóa tòa nhà

  Departments:
    GET    /departments           - Danh sách tất cả phòng ban (có filter)
    GET    /departments/{id}      - Chi tiết một phòng ban
    POST   /departments           - Tạo mới phòng ban
    PUT    /departments/{id}      - Cập nhật phòng ban
    DELETE /departments/{id}      - Xóa phòng ban

  Utilities (Public - cho Mobile App):
    GET    /map/buildings         - Toàn bộ dữ liệu tòa nhà cho map render
    GET    /map/departments       - Toàn bộ phòng ban có tọa độ để render marker

  Seed:
    POST   /departments/seed-from-geojson  - Import dữ liệu từ file GeoJSON có sẵn
"""

import logging
import json
import os
import re
import asyncio
from typing import List, Optional
import httpx

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from db.models import Building, Department
from api.schemas.admin_schema import (
    BuildingCreate, BuildingUpdate, BuildingResponse, BuildingWithDepartmentsResponse,
    DepartmentCreate, DepartmentUpdate, DepartmentResponse,
)
from db.connection import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Campus Map - Buildings & Departments"])

async def _notify_chatbot_sync(dept_id: Optional[int] = None):
    """Gửi tín hiệu đồng bộ vector phòng ban sang api-chatbot trong background."""
    chatbot_url = os.getenv("CHATBOT_API_URL", "http://localhost:8001")
    endpoint = f"{chatbot_url}/api/sync/departments" if dept_id is None else f"{chatbot_url}/api/sync/departments/{dept_id}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(endpoint)
            logger.info("[SyncHook] Đã gửi tín hiệu đồng bộ vector phòng ban sang chatbot: %s", endpoint)
    except Exception as e:
        logger.warning("[SyncHook] Không thể kết nối api-chatbot để đồng bộ: %s", str(e))



# ─────────────────────────────────────────────
# HELPER: Tạo code chuẩn từ tên tòa nhà
# ─────────────────────────────────────────────
def _make_code(name: str) -> str:
    """Chuyển tên tiếng Việt thành code ASCII dùng làm unique key."""
    replacements = {
        "à": "a", "á": "a", "ả": "a", "ã": "a", "ạ": "a",
        "ă": "a", "ằ": "a", "ắ": "a", "ẳ": "a", "ẵ": "a", "ặ": "a",
        "â": "a", "ầ": "a", "ấ": "a", "ẩ": "a", "ẫ": "a", "ậ": "a",
        "è": "e", "é": "e", "ẻ": "e", "ẽ": "e", "ẹ": "e",
        "ê": "e", "ề": "e", "ế": "e", "ể": "e", "ễ": "e", "ệ": "e",
        "ì": "i", "í": "i", "ỉ": "i", "ĩ": "i", "ị": "i",
        "ò": "o", "ó": "o", "ỏ": "o", "õ": "o", "ọ": "o",
        "ô": "o", "ồ": "o", "ố": "o", "ổ": "o", "ỗ": "o", "ộ": "o",
        "ơ": "o", "ờ": "o", "ớ": "o", "ở": "o", "ỡ": "o", "ợ": "o",
        "ù": "u", "ú": "u", "ủ": "u", "ũ": "u", "ụ": "u",
        "ư": "u", "ừ": "u", "ứ": "u", "ử": "u", "ữ": "u", "ự": "u",
        "ỳ": "y", "ý": "y", "ỷ": "y", "ỹ": "y", "ỵ": "y",
        "đ": "d",
        "À": "A", "Á": "A", "Ả": "A", "Ã": "A", "Ạ": "A",
        "Ă": "A", "Ằ": "A", "Ắ": "A", "Ẳ": "A", "Ẵ": "A", "Ặ": "A",
        "Â": "A", "Ầ": "A", "Ấ": "A", "Ẩ": "A", "Ẫ": "A", "Ậ": "A",
        "È": "E", "É": "E", "Ẻ": "E", "Ẽ": "E", "Ẹ": "E",
        "Ê": "E", "Ề": "E", "Ế": "E", "Ể": "E", "Ễ": "E", "Ệ": "E",
        "Ì": "I", "Í": "I", "Ỉ": "I", "Ĩ": "I", "Ị": "I",
        "Ò": "O", "Ó": "O", "Ỏ": "O", "Õ": "O", "Ọ": "O",
        "Ô": "O", "Ồ": "O", "Ố": "O", "Ổ": "O", "Ỗ": "O", "Ộ": "O",
        "Ơ": "O", "Ờ": "O", "Ớ": "O", "Ở": "O", "Ỡ": "O", "Ợ": "O",
        "Ù": "U", "Ú": "U", "Ủ": "U", "Ũ": "U", "Ụ": "U",
        "Ư": "U", "Ừ": "U", "Ứ": "U", "Ử": "U", "Ữ": "U", "Ự": "U",
        "Ỳ": "Y", "Ý": "Y", "Ỷ": "Y", "Ỹ": "Y", "Ỵ": "Y",
        "Đ": "D",
    }
    result = ""
    for char in name:
        result += replacements.get(char, char)
    # Giữ chỉ ký tự ASCII, chuyển thành uppercase_snake_case
    result = re.sub(r"[^a-zA-Z0-9\s]", "", result)
    result = re.sub(r"\s+", "_", result.strip())
    return result.upper()


# ─────────────────────────────────────────────
# BUILDING ENDPOINTS
# ─────────────────────────────────────────────

@router.get("/buildings", response_model=List[BuildingResponse], summary="Lấy danh sách tòa nhà")
async def list_buildings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Building).order_by(Building.name))
    return result.scalars().all()


@router.get(
    "/buildings/{building_id}",
    response_model=BuildingWithDepartmentsResponse,
    summary="Chi tiết tòa nhà kèm danh sách phòng ban"
)
async def get_building(building_id: int, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Building)
        .options(selectinload(Building.departments))
        .where(Building.id == building_id)
    )
    building = result.scalar_one_or_none()
    if not building:
        raise HTTPException(status_code=404, detail="Tòa nhà không tồn tại")
    return building


@router.post("/buildings", response_model=BuildingResponse, status_code=status.HTTP_201_CREATED, summary="Tạo mới tòa nhà")
async def create_building(item_in: BuildingCreate, db: AsyncSession = Depends(get_db)):
    # Kiểm tra trùng code
    existing = await db.execute(select(Building).where(Building.code == item_in.code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Tòa nhà với code '{item_in.code}' đã tồn tại")
    obj = Building(**item_in.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    logger.info("[Building] Tạo mới: %s (%s)", obj.name, obj.code)
    return obj


@router.put("/buildings/{building_id}", response_model=BuildingResponse, summary="Cập nhật tòa nhà")
async def update_building(building_id: int, item_in: BuildingUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Building, building_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Tòa nhà không tồn tại")
    for key, value in item_in.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/buildings/{building_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Xóa tòa nhà")
async def delete_building(building_id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Building, building_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Tòa nhà không tồn tại")
    await db.delete(obj)
    await db.commit()
    return None


# ─────────────────────────────────────────────
# DEPARTMENT ENDPOINTS
# ─────────────────────────────────────────────

@router.get(
    "/departments",
    response_model=List[DepartmentResponse],
    summary="Danh sách phòng ban (có thể filter theo building_id hoặc tìm kiếm)"
)
async def list_departments(
    building_id: Optional[int] = Query(None, description="Lọc theo ID tòa nhà"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo tên"),
    is_active: Optional[bool] = Query(None, description="Lọc theo trạng thái hiển thị"),
    lang: Optional[str] = Query("vi", description="Ngôn ngữ: vi, en, lo"),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm import selectinload
    query = select(Department).options(selectinload(Department.building)).order_by(Department.name)

    if building_id is not None:
        query = query.where(Department.building_id == building_id)
    if search:
        keyword = f"%{search}%"
        query = query.where(
            or_(
                Department.name.ilike(keyword),
                Department.function_description.ilike(keyword),
                Department.name_en.ilike(keyword),
            )
        )
    if is_active is not None:
        query = query.where(Department.is_active == is_active)

    result = await db.execute(query)
    depts = result.scalars().all()

    if lang in ('en', 'lo'):
        for d in depts:
            if lang == 'en':
                if d.name_en:
                    d.name = d.name_en
                if d.function_description_en:
                    d.function_description = d.function_description_en
                if d.building and d.building.name_en:
                    d.building.name = d.building.name_en
            elif lang == 'lo':
                if d.name_lao:
                    d.name = d.name_lao
                if d.function_description_lao:
                    d.function_description = d.function_description_lao
                if d.building and d.building.name_lao:
                    d.building.name = d.building.name_lao

    return depts


@router.get("/departments/{dept_id}", response_model=DepartmentResponse, summary="Chi tiết phòng ban")
async def get_department(dept_id: int, lang: Optional[str] = Query("vi"), db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Department)
        .options(selectinload(Department.building))
        .where(Department.id == dept_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Phòng ban không tồn tại")
    
    if lang == 'en':
        if obj.name_en:
            obj.name = obj.name_en
        if obj.function_description_en:
            obj.function_description = obj.function_description_en
        if obj.building and obj.building.name_en:
            obj.building.name = obj.building.name_en
    elif lang == 'lo':
        if obj.name_lao:
            obj.name = obj.name_lao
        if obj.function_description_lao:
            obj.function_description = obj.function_description_lao
        if obj.building and obj.building.name_lao:
            obj.building.name = obj.building.name_lao

    return obj



@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED, summary="Tạo phòng ban mới")
async def create_department(item_in: DepartmentCreate, db: AsyncSession = Depends(get_db)):
    # Kiểm tra building_id hợp lệ nếu có
    if item_in.building_id:
        building = await db.get(Building, item_in.building_id)
        if not building:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy tòa nhà ID={item_in.building_id}")
    obj = Department(**item_in.model_dump())
    db.add(obj)
    await db.commit()
    # Eagerly reload với relationship để tránh MissingGreenlet
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Department).options(selectinload(Department.building)).where(Department.id == obj.id)
    )
    obj = result.scalar_one()
    logger.info("[Department] Tạo mới: %s (tầng %s)", obj.name, obj.floor)
    asyncio.create_task(_notify_chatbot_sync(obj.id))
    return obj


@router.put("/departments/{dept_id}", response_model=DepartmentResponse, summary="Cập nhật phòng ban")
async def update_department(dept_id: int, item_in: DepartmentUpdate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Department, dept_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Phòng ban không tồn tại")
    update_data = item_in.model_dump(exclude_unset=True)
    if "building_id" in update_data and update_data["building_id"]:
        building = await db.get(Building, update_data["building_id"])
        if not building:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy tòa nhà ID={update_data['building_id']}")
    for key, value in update_data.items():
        setattr(obj, key, value)
    await db.commit()
    # Eagerly reload với relationship
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Department).options(selectinload(Department.building)).where(Department.id == dept_id)
    )
    obj = result.scalar_one()
    asyncio.create_task(_notify_chatbot_sync(obj.id))
    return obj


@router.delete("/departments/{dept_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Xóa phòng ban")
async def delete_department(dept_id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Department, dept_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Phòng ban không tồn tại")
    await db.delete(obj)
    await db.commit()
    asyncio.create_task(_notify_chatbot_sync(dept_id))
    return None



# ─────────────────────────────────────────────
# PUBLIC MAP API (Mobile App)
# ─────────────────────────────────────────────

@router.get(
    "/map/buildings",
    summary="[Public] Toàn bộ tòa nhà kèm phòng ban cho Mobile Map",
    response_model=List[BuildingWithDepartmentsResponse],
)
async def map_get_buildings(lang: Optional[str] = Query("vi"), db: AsyncSession = Depends(get_db)):
    """
    Endpoint công khai cho Mobile App gọi khi khởi động bản đồ.
    Trả về toàn bộ danh sách tòa nhà và phòng ban con kèm tọa độ.
    """
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Building)
        .options(selectinload(Building.departments))
        .order_by(Building.name)
    )
    buildings = result.scalars().all()

    if lang in ('en', 'lo'):
        for b in buildings:
            if lang == 'en':
                if b.name_en:
                    b.name = b.name_en
                if b.description:
                    pass
                for d in b.departments:
                    if d.name_en:
                        d.name = d.name_en
                    if d.function_description_en:
                        d.function_description = d.function_description_en
            elif lang == 'lo':
                if b.name_lao:
                    b.name = b.name_lao
                for d in b.departments:
                    if d.name_lao:
                        d.name = d.name_lao
                    if d.function_description_lao:
                        d.function_description = d.function_description_lao

    return buildings


@router.get(
    "/map/departments",
    summary="[Public] Phòng ban có tọa độ - render marker trên bản đồ",
    response_model=List[DepartmentResponse],
)
async def map_get_department_markers(
    is_building: Optional[bool] = Query(None, description="True=POI tòa nhà độc lập, False=phòng ban trong tòa nhà"),
    lang: Optional[str] = Query("vi"),
    db: AsyncSession = Depends(get_db),
):
    """
    Trả về danh sách phòng ban/địa điểm có tọa độ để hiển thị marker.
    Dùng trong mobile app để overlay lên bản đồ MapLibre.
    """
    from sqlalchemy.orm import selectinload
    query = (
        select(Department)
        .options(selectinload(Department.building))
        .where(Department.is_active == True)  # noqa: E712
        .where(Department.latitude.isnot(None))
        .where(Department.longitude.isnot(None))
    )
    if is_building is not None:
        query = query.where(Department.is_building == is_building)
    result = await db.execute(query)
    depts = result.scalars().all()

    if lang in ('en', 'lo'):
        for d in depts:
            if lang == 'en':
                if d.name_en:
                    d.name = d.name_en
                if d.function_description_en:
                    d.function_description = d.function_description_en
                if d.building and d.building.name_en:
                    d.building.name = d.building.name_en
            elif lang == 'lo':
                if d.name_lao:
                    d.name = d.name_lao
                if d.function_description_lao:
                    d.function_description = d.function_description_lao
                if d.building and d.building.name_lao:
                    d.building.name = d.building.name_lao

    return depts



# ─────────────────────────────────────────────
# SEED FROM GEOJSON (Admin utility)
# ─────────────────────────────────────────────

@router.post(
    "/departments/seed-from-geojson",
    summary="[Admin] Import dữ liệu tòa nhà & phòng ban từ file GeoJSON có sẵn",
    status_code=status.HTTP_200_OK,
)
async def seed_from_geojson(db: AsyncSession = Depends(get_db)):
    """
    Đọc vinhuni_buildings.geojson và vinhuni_departments.geojson,
    tự động tạo bản ghi trong bảng `buildings` và `departments`.
    
    Idempotent - sử dụng upsert logic dựa trên tên (name):
    - Building: upsert theo code
    - Department: upsert theo tên + tọa độ
    """
    # Tìm đường dẫn đến file GeoJSON
    _BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    buildings_path = os.path.join(_BASE, "static", "data", "vinhuni_buildings.geojson")
    departments_path = os.path.join(_BASE, "static", "data", "vinhuni_departments.geojson")

    stats = {"buildings_created": 0, "buildings_updated": 0, "departments_created": 0, "departments_skipped": 0}

    # ── 1. Tạo bảng Building từ vinhuni_buildings.geojson ──────────────────────
    if not os.path.exists(buildings_path):
        raise HTTPException(status_code=404, detail=f"Không tìm thấy file: {buildings_path}")

    with open(buildings_path, "r", encoding="utf-8") as f:
        buildings_geojson = json.load(f)

    # Map tên → DB record để dùng khi seed departments
    building_name_to_db: dict[str, Building] = {}

    for feature in buildings_geojson.get("features", []):
        props = feature.get("properties", {})
        geometry = feature.get("geometry", {})
        name = props.get("name")
        if not name:
            continue

        # Tính centroid từ coordinates của MultiPolygon
        try:
            coords_raw = geometry.get("coordinates", [])
            all_points: list[list[float]] = []
            # MultiPolygon: [[[ring], [ring]], ...]
            # Polygon: [[ring], [ring], ...]
            geo_type = geometry.get("type", "")
            if geo_type == "MultiPolygon":
                for polygon in coords_raw:
                    for ring in polygon:
                        all_points.extend(ring)
            elif geo_type == "Polygon":
                for ring in coords_raw:
                    all_points.extend(ring)

            if all_points:
                centroid_lng = sum(p[0] for p in all_points) / len(all_points)
                centroid_lat = sum(p[1] for p in all_points) / len(all_points)
            else:
                centroid_lat, centroid_lng = 0.0, 0.0
        except Exception:
            centroid_lat, centroid_lng = 0.0, 0.0

        code = _make_code(name)
        geojson_id = props.get("id")

        # Upsert by code
        result = await db.execute(select(Building).where(Building.code == code))
        existing = result.scalar_one_or_none()

        if existing:
            existing.name = name
            existing.latitude = centroid_lat
            existing.longitude = centroid_lng
            existing.geojson_id = geojson_id if geojson_id is not None else existing.geojson_id
            await db.flush()
            building_name_to_db[name] = existing
            stats["buildings_updated"] += 1
        else:
            new_building = Building(
                code=code,
                name=name,
                latitude=centroid_lat,
                longitude=centroid_lng,
                geojson_id=geojson_id,
                total_floors=max(1, (props.get("height", 5) // 3) or 1),
            )
            db.add(new_building)
            await db.flush()
            await db.refresh(new_building)
            building_name_to_db[name] = new_building
            stats["buildings_created"] += 1

    await db.commit()
    logger.info("[Seed] Buildings: created=%d, updated=%d", stats["buildings_created"], stats["buildings_updated"])

    # ── 2. Tạo bảng Department từ vinhuni_departments.geojson ──────────────────
    if not os.path.exists(departments_path):
        logger.warning("[Seed] Không tìm thấy vinhuni_departments.geojson - bỏ qua phòng ban")
    else:
        with open(departments_path, "r", encoding="utf-8") as f:
            departments_geojson = json.load(f)

        for feature in departments_geojson.get("features", []):
            props = feature.get("properties", {})
            geometry = feature.get("geometry", {})
            name = props.get("name")
            if not name:
                continue

            # Lọc bỏ dữ liệu test không hợp lệ
            if "Trọ của" in name:
                stats["departments_skipped"] += 1
                continue

            # Tọa độ từ Point geometry
            coords = geometry.get("coordinates", [None, None])
            lat = float(coords[1]) if coords and len(coords) >= 2 else None
            lng = float(coords[0]) if coords and len(coords) >= 2 else None

            floor_str = str(props.get("floor", "1")) if props.get("floor") else "1"
            is_building_flag = bool(props.get("is_building", False))

            # Tìm building liên kết theo tên
            building_obj = building_name_to_db.get(name)

            # Kiểm tra tồn tại theo tên + tầng
            existing_q = await db.execute(
                select(Department).where(
                    Department.name == name,
                    Department.floor == floor_str,
                )
            )
            existing_dept = existing_q.scalar_one_or_none()

            if existing_dept:
                # Cập nhật tọa độ và building_id nếu chưa có
                if lat is not None:
                    existing_dept.latitude = lat
                    existing_dept.longitude = lng
                if building_obj and not existing_dept.building_id:
                    existing_dept.building_id = building_obj.id
                stats["departments_skipped"] += 1  # Bỏ qua tạo mới
            else:
                new_dept = Department(
                    name=name,
                    floor=floor_str,
                    latitude=lat,
                    longitude=lng,
                    is_building=is_building_flag,
                    building_id=building_obj.id if building_obj else None,
                    is_active=True,
                )
                db.add(new_dept)
                stats["departments_created"] += 1

        await db.commit()
        logger.info(
            "[Seed] Departments: created=%d, skipped=%d",
            stats["departments_created"], stats["departments_skipped"]
        )
        asyncio.create_task(_notify_chatbot_sync())
        return {
        "success": True,
        "message": "Import từ GeoJSON hoàn tất",
        "stats": stats,
    }
