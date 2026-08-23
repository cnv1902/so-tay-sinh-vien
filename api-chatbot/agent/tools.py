"""
agent/tools.py
==============
Công cụ RAG cho Agent (Search Semantic & Lịch/Sự kiện).
"""

import logging
from typing import Optional, Any
from pydantic import BaseModel, Field
from langchain_core.tools import tool
import json
import datetime
from sqlalchemy.future import select
from sqlalchemy import extract, or_

from core.embedder import embed
from core.vectordb import search as qdrant_search
from core.query_expansion import expand_query
from db.connection import AsyncSessionLocal
from db.models import (
    CalendarEvent, EmergencyContact, EmergencyTemplate, 
    Location, News, Building, Department
)

logger = logging.getLogger(__name__)

# ===========================================================================
# Tool 1: search_unstructured_knowledge
# ===========================================================================

class SearchKnowledgeInput(BaseModel):
    query: str = Field(..., description="Câu hỏi tìm kiếm semantic (vd: Điều kiện xét học bạ, quy chế, nội quy, v.v.)")
    year: Optional[int] = Field(None, description="Năm phát hành tài liệu. CHỈ ĐIỀN NẾU CHẮC CHẮN.")
    doc_type: Optional[str] = Field(None, description="Loại tài liệu (de_an, quy_che, hoc_phi). CHỈ ĐIỀN NẾU CHẮC CHẮN.")

@tool("search_unstructured_knowledge", args_schema=SearchKnowledgeInput)
def search_unstructured_knowledge(
    query: str,
    year: Optional[int] = None,
    doc_type: Optional[str] = None,
) -> str:
    """
    Tìm kiếm thông tin trong các văn bản quy chế, đề án, hướng dẫn, học phí, giới thiệu trường.
    Ưu tiên gọi tool này khi người dùng hỏi các câu hỏi chung, thủ tục, quy định, mô tả, đời sống, cơ sở vật chất.
    """
    logger.info(f"[Tool] search_unstructured_knowledge called: query='{query}', year={year}, doc_type={doc_type}")
    
    try:
        expanded_query = expand_query(query)
        query_vector = embed(expanded_query)
    except Exception as e:
        logger.error(f"[Tool] Embed failed: {str(e)}")
        return "Xin lỗi, hiện tại không thể tìm kiếm tài liệu (Lỗi vectorization)."

    def do_search(filters: dict) -> list[dict]:
        return qdrant_search(query_vector=query_vector, filters=filters, top_k=3, score_threshold=0.01)

    strict_filters = {}
    if year: strict_filters["year"] = year
    if doc_type: strict_filters["doc_type"] = doc_type
    
    results = do_search(strict_filters)
    
    if not results:
        relaxed_filters_1 = {}
        if year: relaxed_filters_1["year"] = year
        if relaxed_filters_1 != strict_filters:
            results = do_search(relaxed_filters_1)
            
        if not results:
            results = do_search({})

    if not results:
        return "Tôi không tìm thấy thông tin văn bản nào liên quan đến câu hỏi của bạn."

    lines = []
    for r in results:
        content = r.get("content", "").strip()
        metadata = r.get("metadata", {})
        source_file = metadata.get("source_file", "Cơ sở dữ liệu")
        
        lines.append(f"--- Nguồn: {source_file} ---\n{content}\n")
        
    return "Thông tin tìm thấy:\n\n" + "\n".join(lines)


# ===========================================================================
# Tool 2: search_calendar_events
# ===========================================================================

class CalendarEventsInput(BaseModel):
    month: Optional[int] = Field(None, description="Tháng cần tra cứu lịch sự kiện/nghỉ lễ (1-12). Nếu không rõ, hãy để trống.")
    year: Optional[int] = Field(None, description="Năm cần tra cứu lịch sự kiện/nghỉ lễ. Nếu không rõ, hãy để trống.")

@tool("search_calendar_events", args_schema=CalendarEventsInput)
async def search_calendar_events(month: Optional[int] = None, year: Optional[int] = None) -> str:
    """
    Tìm kiếm thông tin các sự kiện, lịch học, lịch nghỉ lễ, hạn chót dựa theo tháng và năm.
    BẮT BUỘC SỬ DỤNG khi người dùng hỏi thông tin về Lịch học, Ngày nghỉ lễ, Sự kiện.
    """
    logger.info(f"[Tool] search_calendar_events called: month={month}, year={year}")
    
    now = datetime.datetime.now()
    if year is None:
        year = now.year

    try:
        from zoneinfo import ZoneInfo
        vn_tz = ZoneInfo("Asia/Ho_Chi_Minh")
        
        async with AsyncSessionLocal() as session:
            if month is None:
                # Trường hợp chỉ truyền year (Tìm theo năm)
                stmt = select(CalendarEvent).where(
                    or_(
                        extract('year', CalendarEvent.start_time) == year,
                        CalendarEvent.is_annual == True
                    )
                )
            else:
                # Trường hợp truyền cả month và year (Tìm theo tháng cụ thể)
                stmt = select(CalendarEvent).where(
                    or_(
                        (extract('month', CalendarEvent.start_time) == month) & (extract('year', CalendarEvent.start_time) == year),
                        (CalendarEvent.is_annual == True) & (extract('month', CalendarEvent.start_time) == month)
                    )
                )
                
            # Sắp xếp tăng dần theo tháng và ngày
            stmt = stmt.order_by(
                extract('month', CalendarEvent.start_time).asc(),
                extract('day', CalendarEvent.start_time).asc()
            )
            result = await session.execute(stmt)
            events = result.scalars().all()
            
            if not events:
                return f"Không tìm thấy sự kiện, lịch nghỉ lễ hay hạn chót nào trong tháng {month}/{year}."
            
            events_list = []
            for e in events:
                st = e.start_time.astimezone(vn_tz) if e.start_time.tzinfo else e.start_time.replace(tzinfo=datetime.timezone.utc).astimezone(vn_tz)
                et = e.end_time.astimezone(vn_tz) if e.end_time.tzinfo else e.end_time.replace(tzinfo=datetime.timezone.utc).astimezone(vn_tz)
                
                if e.is_annual:
                    format_str = "%d/%m (Hàng năm)" if e.is_all_day else "%H:%M %d/%m (Hàng năm)"
                else:
                    format_str = "%d/%m/%Y" if e.is_all_day else "%H:%M %d/%m/%Y"
                
                events_list.append({
                    "title": e.title,
                    "category": e.category,
                    "start": st.strftime(format_str),
                    "end": et.strftime(format_str)
                })
                
            return json.dumps(events_list, ensure_ascii=False)
            
    except Exception as e:
        logger.error(f"[Tool] search_calendar_events failed: {e}")
        return f"Lỗi khi tra cứu lịch sự kiện: {e}"
# ===========================================================================
# Tool 3: search_emergency_contacts
# ===========================================================================

class EmergencyContactsInput(BaseModel):
    category: Optional[str] = Field(None, description="Loại liên hệ khẩn cấp: POLICE, MEDICAL, FIRE, UNIVERSITY_DEPT. Bỏ trống nếu không rõ.")
    ward: Optional[str] = Field(None, description="Tên phường/xã/khu vực (ví dụ: Bến Thủy, Trường Thi). Bỏ trống nếu không rõ.")

@tool("search_emergency_contacts", args_schema=EmergencyContactsInput)
async def search_emergency_contacts(category: Optional[str] = None, ward: Optional[str] = None) -> str:
    """
    Tra cứu số điện thoại khẩn cấp (Công an, Y tế, PCCC, Phòng ban trường).
    Sử dụng khi sinh viên cần liên hệ khẩn cấp hoặc xin số điện thoại công an khu vực, bệnh viện.
    """
    logger.info(f"[Tool] search_emergency_contacts called: category={category}, ward={ward}")
    try:
        async with AsyncSessionLocal() as session:
            stmt = select(EmergencyContact)
            if category:
                stmt = stmt.where(EmergencyContact.category == category.upper())
            if ward:
                # Tìm kiếm tương đối bằng ilike
                stmt = stmt.where(EmergencyContact.ward.ilike(f"%{ward}%"))
                
            result = await session.execute(stmt)
            contacts = result.scalars().all()
            
            if not contacts:
                return "Không tìm thấy số điện thoại khẩn cấp nào phù hợp với yêu cầu."
                
            res_list = []
            for c in contacts:
                res_list.append(f"- Tên: {c.name}\n  SĐT: {c.phone_number}\n  Mô tả: {c.description or 'Không có'}\n  Khu vực: {c.ward or 'Chung'}")
                
            return "Danh bạ khẩn cấp:\n\n" + "\n\n".join(res_list)
    except Exception as e:
        logger.error(f"[Tool] Lỗi truy vấn EmergencyContact: {str(e)}")
        return "Lỗi hệ thống khi tra cứu số điện thoại khẩn cấp."

# ===========================================================================
# Tool 4: search_location_info
# ===========================================================================

class LocationInfoInput(BaseModel):
    category: Optional[str] = Field(None, description="Loại địa điểm (ví dụ: HOSPITAL, BANK, POLICE, MARKET, BUS_STOP). Bỏ trống nếu không rõ.")
    query: Optional[str] = Field(None, description="Tên địa điểm cần tìm kiếm. Bỏ trống nếu không rõ.")

@tool("search_location_info", args_schema=LocationInfoInput)
async def search_location_info(category: Optional[str] = None, query: Optional[str] = None) -> str:
    """
    Tra cứu các địa điểm tiện ích BÊN NGOÀI khuôn viên trường (bệnh viện, ngân hàng, điểm dừng xe buýt, chợ...).
    Kết quả có kèm link bản đồ (map_link).
    """
    logger.info(f"[Tool] search_location_info called: category={category}, query={query}")
    try:
        async with AsyncSessionLocal() as session:
            stmt = select(Location)
            if category:
                stmt = stmt.where(Location.category.ilike(f"%{category}%"))
            if query:
                stmt = stmt.where(or_(
                    Location.name.ilike(f"%{query}%"),
                    Location.description.ilike(f"%{query}%")
                ))
                
            result = await session.execute(stmt)
            locations = result.scalars().all()
            
            if not locations:
                return "Không tìm thấy địa điểm nào phù hợp với yêu cầu."
                
            res_list = []
            for loc in locations:
                link = loc.map_link or f"https://www.google.com/maps/search/?api=1&query={loc.latitude},{loc.longitude}" if loc.latitude and loc.longitude else "Không có link bản đồ"
                res_list.append(f"- Tên: {loc.name}\n  Loại: {loc.category}\n  Mô tả: {loc.description or 'Không có'}\n  Bản đồ: {link}")
                
            return "Thông tin địa điểm:\n\n" + "\n\n".join(res_list)
    except Exception as e:
        logger.error(f"[Tool] Lỗi truy vấn Location: {str(e)}")
        return "Lỗi hệ thống khi tra cứu địa điểm."

# ===========================================================================
# Tool 5: search_department_info
# ===========================================================================

class DepartmentInfoInput(BaseModel):
    query: str = Field(..., description="Tên phòng ban hoặc chức năng (ví dụ: 'Phòng Đào tạo', 'Làm thẻ sinh viên').")
    building_name: Optional[str] = Field(None, description="Tên tòa nhà (ví dụ: 'Nhà A1', 'Nhà Điều hành'). Bỏ trống nếu không rõ.")

@tool("search_department_info", args_schema=DepartmentInfoInput)
async def search_department_info(query: str, building_name: Optional[str] = None) -> str:
    """
    Tìm kiếm thông tin các phòng ban TRONG trường (Tên phòng, Số phòng, Tầng, Tòa nhà, Giờ làm việc, SĐT).
    Cực kỳ hữu ích khi sinh viên hỏi phòng ban ở đâu, hoặc giải quyết giấy tờ ở đâu.
    Kết quả trả về tọa độ để dẫn đường (navigate_to).
    """
    logger.info(f"[Tool] search_department_info called: query={query}, building={building_name}")
    try:
        async with AsyncSessionLocal() as session:
            from sqlalchemy.orm import selectinload
            stmt = select(Department).options(selectinload(Department.building))
            
            # Tìm trong tên hoặc chức năng của phòng ban
            stmt = stmt.where(or_(
                Department.name.ilike(f"%{query}%"),
                Department.function_description.ilike(f"%{query}%")
            ))
            
            result = await session.execute(stmt)
            departments = result.scalars().all()
            
            if building_name:
                departments = [d for d in departments if d.building and building_name.lower() in d.building.name.lower()]
            
            if not departments:
                return "Không tìm thấy phòng ban nào khớp với yêu cầu tìm kiếm."
                
            res_list = []
            for d in departments:
                building = d.building.name if d.building else "Chưa xác định"
                location_str = f"{building}, Tầng {d.floor or '?'}, Phòng {d.room_number or '?'}"
                
                # Tạo một Navigation Hint ngầm định
                lat = d.latitude or (d.building.latitude if d.building else None)
                lng = d.longitude or (d.building.longitude if d.building else None)
                coords = f"[Tọa độ: {lat}, {lng}]" if lat and lng else ""
                
                info = (
                    f"- {d.name}\n"
                    f"  Vị trí: {location_str} {coords}\n"
                    f"  SĐT: {d.phone_number or 'Không có'}\n"
                    f"  Giờ làm việc: {d.working_hours or 'Giờ hành chính'}\n"
                    f"  Chức năng: {d.function_description or 'Không có mô tả'}"
                )
                res_list.append(info)
                
            return "Thông tin phòng ban:\n\n" + "\n\n".join(res_list)
    except Exception as e:
        logger.error(f"[Tool] Lỗi truy vấn Department: {str(e)}")
        return "Lỗi hệ thống khi tra cứu phòng ban."


# ===========================================================================
# Tool 6: search_news
# ===========================================================================

class NewsInput(BaseModel):
    query: Optional[str] = Field(None, description="Từ khóa tìm kiếm tin tức/thông báo. Bỏ trống để lấy tin mới nhất.")
    limit: Optional[int] = Field(3, description="Số lượng tin tức muốn lấy.")

@tool("search_news", args_schema=NewsInput)
async def search_news(query: Optional[str] = None, limit: Optional[int] = 3) -> str:
    """
    Tra cứu các tin tức, thông báo mới nhất từ trường Đại học Vinh.
    """
    logger.info(f"[Tool] search_news called: query={query}")
    try:
        async with AsyncSessionLocal() as session:
            stmt = select(News)
            if query:
                stmt = stmt.where(or_(
                    News.title.ilike(f"%{query}%"),
                    News.content.ilike(f"%{query}%")
                ))
            stmt = stmt.order_by(News.created_at.desc()).limit(limit)
                
            result = await session.execute(stmt)
            news_items = result.scalars().all()
            
            if not news_items:
                return "Không có thông báo hoặc tin tức nào phù hợp."
                
            res_list = []
            for n in news_items:
                date_str = n.created_at.strftime("%d/%m/%Y") if n.created_at else "Mới"
                # Rút gọn nội dung
                content_preview = n.content[:200] + "..." if len(n.content) > 200 else n.content
                res_list.append(f"[{date_str}] {n.title}\n{content_preview}")
                
            return "Tin tức & Thông báo:\n\n" + "\n\n".join(res_list)
    except Exception as e:
        logger.error(f"[Tool] Lỗi truy vấn News: {str(e)}")
        return "Lỗi hệ thống khi tra cứu tin tức."

# ===========================================================================
# Tool 7: get_emergency_templates
# ===========================================================================

class EmergencyTemplateInput(BaseModel):
    category: str = Field(..., description="Loại tình huống khẩn cấp (vd: SOS, ACCIDENT, FIRE, MEDICAL, LOST).")

@tool("get_emergency_templates", args_schema=EmergencyTemplateInput)
async def get_emergency_templates(category: str) -> str:
    """
    Lấy các mẫu tin nhắn khẩn cấp soạn sẵn (ví dụ mẫu báo mất đồ, báo công an, gọi cấp cứu).
    Đặc biệt hữu ích để hướng dẫn sinh viên quốc tế hoặc sinh viên không biết cách trình bày tình huống.
    """
    logger.info(f"[Tool] get_emergency_templates called: category={category}")
    try:
        async with AsyncSessionLocal() as session:
            stmt = select(EmergencyTemplate).where(EmergencyTemplate.category.ilike(f"%{category}%"))
            result = await session.execute(stmt)
            templates = result.scalars().all()
            
            if not templates:
                return f"Không tìm thấy mẫu tin nhắn nào cho loại tình huống '{category}'."
                
            res_list = []
            for t in templates:
                res_list.append(f"- Tình huống [{t.category}]:\n  Mẫu: \"{t.message_template}\"")
                
            return "Các mẫu tin nhắn khẩn cấp:\n\n" + "\n\n".join(res_list)
    except Exception as e:
        logger.error(f"[Tool] Lỗi truy vấn EmergencyTemplate: {str(e)}")
        return "Lỗi hệ thống khi tải mẫu tin nhắn."
