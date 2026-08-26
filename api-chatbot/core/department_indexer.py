"""
core/department_indexer.py
==========================
Đồng bộ và Vector hóa toàn bộ danh mục Phòng ban & Tòa nhà vào Qdrant (Semantic Search Layer).

Mỗi phòng ban (Department) được trích xuất thành một Document ngữ nghĩa giàu thông tin
kết hợp Tên, Tòa nhà, Tầng, Số phòng, SĐT, Giờ làm việc, Chức năng tiếp nhận hồ sơ, và Tọa độ GPS.
"""

import asyncio
import logging
import uuid
from typing import List, Optional
from qdrant_client import models as qmodels
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from core.embedder import embed
from core.vectordb import upsert_points, _get_client, get_collection_name
from db.connection import AsyncSessionLocal
from db.models import Department, Building

logger = logging.getLogger(__name__)

DEPARTMENT_UUID_NAMESPACE = uuid.NAMESPACE_DNS

def get_department_point_id(dept_id: int, lang: str = "vi") -> str:
    """Tạo UUID Point ID duy nhất cho phòng ban theo ngôn ngữ để tránh xung đột."""
    return str(uuid.uuid5(DEPARTMENT_UUID_NAMESPACE, f"vinhuni_dept_{dept_id}_{lang}"))

def build_department_semantic_text(dept: Department, lang: str = "vi") -> str:
    """Xây dựng chuỗi văn bản giàu ngữ nghĩa cho phòng ban theo từng ngôn ngữ (vi, en, lo)."""
    if lang == "en":
        name = getattr(dept, "name_en", None) or dept.name
        b_name_en = getattr(dept.building, "name_en", None) if dept.building else None
        building_name = b_name_en or (dept.building.name if dept.building else "Campus")
        floor_str = f"Floor {dept.floor}" if dept.floor else "Floor updating"
        room_str = f"Room {dept.room_number}" if dept.room_number else ""
        phone_str = dept.phone_number if dept.phone_number else "N/A"
        hours_str = dept.working_hours if dept.working_hours else "Office hours"
        func_str = getattr(dept, "function_description_en", None) or dept.function_description or "Student support & administrative affairs"
        return (
            f"[Department / Office]: {name}\n"
            f"[Building]: {building_name} ({floor_str}, {room_str})\n"
            f"[Contact Phone]: {phone_str}\n"
            f"[Working Hours]: {hours_str}\n"
            f"[Functions & Duties]: {func_str}"
        ).strip()
    
    elif lang == "lo":
        name = getattr(dept, "name_lao", None) or dept.name
        b_name_lo = getattr(dept.building, "name_lao", None) if dept.building else None
        building_name = b_name_lo or (dept.building.name if dept.building else "ມະຫາວິທະຍາໄລ")
        floor_str = f"ຊັ້ນ {dept.floor}" if dept.floor else ""
        room_str = f"ຫ້ອງ {dept.room_number}" if dept.room_number else ""
        phone_str = dept.phone_number if dept.phone_number else "ບໍ່ມີ"
        hours_str = dept.working_hours if dept.working_hours else "ໂມງລັດຖະການ"
        func_str = getattr(dept, "function_description_lao", None) or dept.function_description or "ຮັບຜິດຊອບ ແລະ ຊ່ວຍເຫຼືອນັກສຶກສາ"
        return (
            f"[ພະແນກ / ຫ້ອງການ]: {name}\n"
            f"[ອາຄານ]: {building_name} ({floor_str}, {room_str})\n"
            f"[ເບີໂທລະສັບ]: {phone_str}\n"
            f"[ໂມງເຮັດວຽກ]: {hours_str}\n"
            f"[ໜ້າທີ່ຮັບຜິດຊອບ]: {func_str}"
        ).strip()


    # Mặc định tiếng Việt
    building_name = dept.building.name if dept.building else "Khuôn viên trường"
    floor_str = f"Tầng {dept.floor}" if dept.floor else "Đang cập nhật tầng"
    room_str = f"Phòng {dept.room_number}" if dept.room_number else ""
    phone_str = dept.phone_number if dept.phone_number else "Chưa có SĐT"
    hours_str = dept.working_hours if dept.working_hours else "Giờ hành chính"
    func_str = dept.function_description if dept.function_description else "Tiếp nhận và hỗ trợ sinh viên"

    return (
        f"[Đơn vị / Phòng ban]: {dept.name}\n"
        f"[Tòa nhà]: {building_name} ({floor_str}, {room_str})\n"
        f"[Điện thoại liên hệ]: {phone_str}\n"
        f"[Giờ làm việc]: {hours_str}\n"
        f"[Chức năng & Nhiệm vụ tiếp nhận]: {func_str}"
    ).strip()

async def index_all_departments() -> int:
    """
    Quét toàn bộ phòng ban trong PostgreSQL, sinh Dense + Sparse Embedding và lưu vào Qdrant (3 ngôn ngữ VI-EN-LO).
    Trả về số lượng vector đã được tạo và lưu trữ.
    """
    logger.info("[DeptIndexer] Bắt đầu quét và vector hóa toàn bộ phòng ban vào Qdrant (Đa ngôn ngữ)...")
    points = []
    
    try:
        async with AsyncSessionLocal() as session:
            stmt = select(Department).options(selectinload(Department.building)).order_by(Department.id)
            result = await session.execute(stmt)
            departments = result.scalars().all()

            if not departments:
                logger.warning("[DeptIndexer] Không tìm thấy phòng ban nào trong CSDL để index.")
                return 0

            for dept in departments:
                building_name = dept.building.name if dept.building else "Chưa xác định"
                lat = dept.latitude or (dept.building.latitude if dept.building else None)
                lng = dept.longitude or (dept.building.longitude if dept.building else None)
                
                try:
                    lat_float = float(lat) if lat else None
                    lng_float = float(lng) if lng else None
                except (ValueError, TypeError):
                    lat_float, lng_float = None, None

                coord_token = f"[Tọa độ: {lat_float}, {lng_float}]" if lat_float and lng_float else ""

                # Vector hóa 3 phiên bản ngôn ngữ
                for lang in ("vi", "en", "lo"):
                    semantic_text = build_department_semantic_text(dept, lang=lang)
                    vector = await asyncio.to_thread(embed, semantic_text)

                    payload = {
                        "doc_type": "phong_ban",
                        "department_id": dept.id,
                        "name": dept.name if lang == "vi" else (dept.name_en if lang == "en" else dept.name_lao) or dept.name,
                        "building_name": building_name,
                        "floor": dept.floor,
                        "room_number": dept.room_number,
                        "phone_number": dept.phone_number,
                        "working_hours": dept.working_hours,
                        "latitude": lat_float,
                        "longitude": lng_float,
                        "coord_token": coord_token,
                        "content": semantic_text,
                        "lang": lang,
                    }

                    point = qmodels.PointStruct(
                        id=get_department_point_id(dept.id, lang=lang),
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
                logger.info(f"[DeptIndexer] ✅ Hoàn tất đẩy {len(points)} vector phòng ban (VI, EN, LO) lên Qdrant thành công.")

            return len(points)

    except Exception as e:
        logger.error(f"[DeptIndexer] Lỗi khi vector hóa phòng ban: {str(e)}", exc_info=True)
        return 0


async def sync_single_department(dept_id: int) -> bool:
    """Cập nhật hoặc xóa vector của 1 phòng ban cụ thể khi Admin thao tác."""
    point_id = get_department_point_id(dept_id)
    client = _get_client()
    collection = get_collection_name()

    try:
        async with AsyncSessionLocal() as session:
            stmt = select(Department).options(selectinload(Department.building)).where(Department.id == dept_id)
            result = await session.execute(stmt)
            dept = result.scalar_one_or_none()

            if not dept:
                # Nếu đã bị xóa khỏi DB -> Xóa Point khỏi Qdrant
                logger.info(f"[DeptIndexer] Xóa point {point_id} của dept_id={dept_id} khỏi Qdrant")
                await asyncio.to_thread(
                    client.delete,
                    collection_name=collection,
                    points_selector=qmodels.PointIdsList(points=[point_id])
                )
                return True

            semantic_text = build_department_semantic_text(dept)
            vector = await asyncio.to_thread(embed, semantic_text)
            
            building_name = dept.building.name if dept.building else "Chưa xác định"
            lat = dept.latitude or (dept.building.latitude if dept.building else None)
            lng = dept.longitude or (dept.building.longitude if dept.building else None)

            try:
                lat_float = float(lat) if lat else None
                lng_float = float(lng) if lng else None
            except (ValueError, TypeError):
                lat_float, lng_float = None, None

            coord_token = f"[Tọa độ: {lat_float}, {lng_float}]" if lat_float and lng_float else ""

            payload = {
                "doc_type": "phong_ban",
                "department_id": dept.id,
                "name": dept.name,
                "building_name": building_name,
                "floor": dept.floor,
                "room_number": dept.room_number,
                "phone_number": dept.phone_number,
                "working_hours": dept.working_hours,
                "latitude": lat_float,
                "longitude": lng_float,
                "coord_token": coord_token,
                "content": semantic_text,
            }

            point = qmodels.PointStruct(
                id=point_id,
                vector={
                    "dense": vector["dense"],
                    "sparse": qmodels.SparseVector(
                        indices=vector["sparse_indices"],
                        values=vector["sparse_values"]
                    )
                },
                payload=payload
            )

            await asyncio.to_thread(upsert_points, [point])
            logger.info(f"[DeptIndexer] ✅ Cập nhật vector cho dept_id={dept_id} ({dept.name}) thành công.")
            return True

    except Exception as e:
        logger.error(f"[DeptIndexer] Lỗi đồng bộ dept_id={dept_id}: {str(e)}", exc_info=True)
        return False
