import asyncio
import os
import sys
import logging

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


from sqlalchemy import text
from sqlalchemy.future import select
from db.connection import AsyncSessionLocal, engine
from db.models import Building, Department, EmergencyContact, CalendarEvent, News, Document
from core.translator import translate_to_en_and_lao

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

async def ensure_columns_exist():
    """Tự động thêm các cột đa ngôn ngữ vào PostgreSQL nếu chưa có."""
    logger.info("🔧 Đang kiểm tra và cập nhật Schema cơ sở dữ liệu (ADD COLUMN IF NOT EXISTS)...")
    async with engine.begin() as conn:
        # Emergency Contacts
        await conn.execute(text("ALTER TABLE emergency_contacts ADD COLUMN IF NOT EXISTS name_en VARCHAR(100);"))
        await conn.execute(text("ALTER TABLE emergency_contacts ADD COLUMN IF NOT EXISTS name_lao VARCHAR(100);"))
        await conn.execute(text("ALTER TABLE emergency_contacts ADD COLUMN IF NOT EXISTS description_en TEXT;"))
        await conn.execute(text("ALTER TABLE emergency_contacts ADD COLUMN IF NOT EXISTS description_lao TEXT;"))

        # Calendar Events
        await conn.execute(text("ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS title_en VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS title_lao VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS description_en TEXT;"))
        await conn.execute(text("ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS description_lao TEXT;"))

        # News
        await conn.execute(text("ALTER TABLE news ADD COLUMN IF NOT EXISTS title_en VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE news ADD COLUMN IF NOT EXISTS title_lao VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE news ADD COLUMN IF NOT EXISTS content_en TEXT;"))
        await conn.execute(text("ALTER TABLE news ADD COLUMN IF NOT EXISTS content_lao TEXT;"))

        # Documents
        await conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS title_en VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS title_lao VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_en TEXT;"))
        await conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_lao TEXT;"))

        # Buildings & Departments
        await conn.execute(text("ALTER TABLE buildings ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE buildings ADD COLUMN IF NOT EXISTS name_lao VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE departments ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE departments ADD COLUMN IF NOT EXISTS name_lao VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE departments ADD COLUMN IF NOT EXISTS function_description_en TEXT;"))
        await conn.execute(text("ALTER TABLE departments ADD COLUMN IF NOT EXISTS function_description_lao TEXT;"))

    logger.info("✅ Kiểm tra Schema hoàn tất!")


async def translate_all_data():
    async with AsyncSessionLocal() as db:

        # 1. BUILDINGS
        logger.info("🏢 Đang quét và dịch Bảng Tòa nhà (Buildings)...")
        b_res = await db.execute(select(Building))
        buildings = b_res.scalars().all()
        for b in buildings:
            if not b.name_en or not b.name_lao:
                en, lao = translate_to_en_and_lao(b.name)
                b.name_en = b.name_en or en
                b.name_lao = b.name_lao or lao
                logger.info(f"  [Building] '{b.name}' -> EN: '{b.name_en}' | LO: '{b.name_lao}'")

        # 2. DEPARTMENTS
        logger.info("🏛️ Đang quét và dịch Bảng Phòng ban / Địa điểm (Departments)...")
        d_res = await db.execute(select(Department))
        depts = d_res.scalars().all()
        for d in depts:
            if not d.name_en or not d.name_lao:
                en, lao = translate_to_en_and_lao(d.name)
                d.name_en = d.name_en or en
                d.name_lao = d.name_lao or lao
                logger.info(f"  [Dept Name] '{d.name}' -> EN: '{d.name_en}' | LO: '{d.name_lao}'")
            if d.function_description and (not d.function_description_en or not d.function_description_lao):
                f_en, f_lao = translate_to_en_and_lao(d.function_description)
                d.function_description_en = d.function_description_en or f_en
                d.function_description_lao = d.function_description_lao or f_lao

        # 3. EMERGENCY CONTACTS
        logger.info("🚨 Đang quét và dịch Bảng Danh bạ Khẩn cấp (EmergencyContact)...")
        ec_res = await db.execute(select(EmergencyContact))
        contacts = ec_res.scalars().all()
        for c in contacts:
            if not c.name_en or not c.name_lao:
                en, lao = translate_to_en_and_lao(c.name)
                c.name_en = c.name_en or en
                c.name_lao = c.name_lao or lao
                logger.info(f"  [Emergency Name] '{c.name}' -> EN: '{c.name_en}' | LO: '{c.name_lao}'")
            if c.description and (not c.description_en or not c.description_lao):
                d_en, d_lao = translate_to_en_and_lao(c.description)
                c.description_en = c.description_en or d_en
                c.description_lao = c.description_lao or d_lao

        # 4. CALENDAR EVENTS
        logger.info("📅 Đang quét và dịch Bảng Sự kiện Lịch (CalendarEvent)...")
        ce_res = await db.execute(select(CalendarEvent))
        events = ce_res.scalars().all()
        for ev in events:
            if not ev.title_en or not ev.title_lao:
                en, lao = translate_to_en_and_lao(ev.title)
                ev.title_en = ev.title_en or en
                ev.title_lao = ev.title_lao or lao
                logger.info(f"  [Calendar Title] '{ev.title}' -> EN: '{ev.title_en}' | LO: '{ev.title_lao}'")
            if ev.description and (not ev.description_en or not ev.description_lao):
                d_en, d_lao = translate_to_en_and_lao(ev.description)
                ev.description_en = ev.description_en or d_en
                ev.description_lao = ev.description_lao or d_lao

        # 5. NEWS
        logger.info("📰 Đang quét và dịch Bảng Tin tức (News)...")
        news_res = await db.execute(select(News))
        news_items = news_res.scalars().all()
        for n in news_items:
            if not n.title_en or not n.title_lao:
                en, lao = translate_to_en_and_lao(n.title)
                n.title_en = n.title_en or en
                n.title_lao = n.title_lao or lao
            if n.content and (not n.content_en or not n.content_lao):
                c_en, c_lao = translate_to_en_and_lao(n.content)
                n.content_en = n.content_en or c_en
                n.content_lao = n.content_lao or c_lao

        # 6. DOCUMENTS
        logger.info("📄 Đang quét và dịch Bảng Sổ tay & Văn bản (Document)...")
        doc_res = await db.execute(select(Document))
        docs = doc_res.scalars().all()
        for d in docs:
            if not d.title_en or not d.title_lao:
                en, lao = translate_to_en_and_lao(d.title)
                d.title_en = d.title_en or en
                d.title_lao = d.title_lao or lao
            if d.content and (not d.content_en or not d.content_lao):
                c_en, c_lao = translate_to_en_and_lao(d.content)
                d.content_en = d.content_en or c_en
                d.content_lao = d.content_lao or c_lao

        await db.commit()
        logger.info("🎉 HOÀN TẤT! Đã dịch tự động và lưu thành công toàn bộ dữ liệu đa ngôn ngữ (VI-EN-LO) vào Database!")


if __name__ == "__main__":
    asyncio.run(translate_all_data())
