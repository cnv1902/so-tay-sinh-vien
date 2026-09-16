from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import (
    admin_documents,
    admin_users,
    admin_emergency,
    admin_calendar,
    admin_news,
    admin_locations,
    admin_services,
    admin_map,
    auth,
    admin_upload,
    admin_departments,
)

import os
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles

async def seed_admin_account():
    from db.connection import AsyncSessionLocal
    from sqlalchemy import select
    from db.models import Account
    from core.security import get_password_hash

    admin_user = os.getenv("ADMIN_DEFAULT_USERNAME", "admin")
    admin_pass = os.getenv("ADMIN_DEFAULT_PASSWORD", "admin")

    async with AsyncSessionLocal() as db:
        try:
            stmt = select(Account).where(Account.username == admin_user)
            res = await db.execute(stmt)
            admin = res.scalar_one_or_none()
            if not admin:
                hashed = get_password_hash(admin_pass)
                # Dùng 'Admin' làm role vì Account chưa có RoleEnum
                admin = Account(username=admin_user, password_hash=hashed, role="Admin")
                db.add(admin)
                await db.commit()
                print(f"[Seed] Đã tạo tài khoản admin mặc định: {admin_user}")
        except Exception as e:
            print(f"[Seed] Bỏ qua seed admin do lỗi (có thể chưa chạy migration): {e}")

async def auto_backfill_translations():
    """Tự động dịch sang EN và LAO cho tất cả News và UploadedDocuments cũ chưa có bản dịch."""
    from db.connection import AsyncSessionLocal
    from sqlalchemy import select
    from db.models import News, UploadedDocument
    from core.translator import translate_to_en_and_lao
    import asyncio

    async with AsyncSessionLocal() as db:
        try:
            # 1. Backfill News
            stmt_news = select(News).where((News.title_en == None) | (News.title_lao == None) | (News.content_en == None) | (News.content_lao == None))
            res_news = await db.execute(stmt_news)
            news_items = res_news.scalars().all()
            for item in news_items:
                if (not item.title_en or not item.title_lao) and item.title:
                    t_en, t_lao = await asyncio.to_thread(translate_to_en_and_lao, item.title)
                    item.title_en = item.title_en or t_en
                    item.title_lao = item.title_lao or t_lao
                if (not item.content_en or not item.content_lao) and item.content:
                    c_en, c_lao = await asyncio.to_thread(translate_to_en_and_lao, item.content)
                    item.content_en = item.content_en or c_en
                    item.content_lao = item.content_lao or c_lao

            # 2. Backfill UploadedDocument
            stmt_docs = select(UploadedDocument).where((UploadedDocument.filename_en == None) | (UploadedDocument.filename_lao == None) | (UploadedDocument.full_content_en == None) | (UploadedDocument.full_content_lao == None))
            res_docs = await db.execute(stmt_docs)
            docs = res_docs.scalars().all()
            for doc in docs:
                if (not doc.filename_en or not doc.filename_lao) and doc.filename:
                    fn_en, fn_lao = await asyncio.to_thread(translate_to_en_and_lao, doc.filename)
                    doc.filename_en = doc.filename_en or fn_en
                    doc.filename_lao = doc.filename_lao or fn_lao
                if (not doc.full_content_en or not doc.full_content_lao) and doc.full_content:
                    c_en, c_lao = await asyncio.to_thread(translate_to_en_and_lao, doc.full_content)
                    doc.full_content_en = doc.full_content_en or c_en
                    doc.full_content_lao = doc.full_content_lao or c_lao

            await db.commit()
            if news_items or docs:
                print(f"[Translation Backfill] Đã tự động cập nhật bản dịch EN/LAO cho {len(news_items)} tin tức và {len(docs)} tài liệu.")
        except Exception as e:
            print(f"[Translation Backfill] Bỏ qua do lỗi: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    from db.connection import init_db
    await init_db()
    await seed_admin_account()
    
    # Chạy backfill bản dịch trong background
    import asyncio
    asyncio.create_task(auto_backfill_translations())
    
    # Khởi tạo đồ thị cho chức năng tìm đường (nếu có file geojson)
    from core.map_engine import map_engine
    import os
    geojson_path = os.path.join(os.path.dirname(__file__), "..", "static", "data", "vinhuni_paths.geojson")
    walkable_path = os.path.join(os.path.dirname(__file__), "..", "static", "data", "vinhuni_walkable_areas.geojson")
    buildings_path = os.path.join(os.path.dirname(__file__), "..", "static", "data", "vinhuni_buildings.geojson")
    if os.path.exists(geojson_path):
        map_engine.load_graph(geojson_path, walkable_path, buildings_path)
    else:
        print(f"[Map] Không tìm thấy file {geojson_path}, bỏ qua tải đồ thị bản đồ.")
    
    yield

app = FastAPI(
    title="Sổ Tay Sinh Viên Backend",
    description="Greenfield project cho các module Quản trị, Tiện ích của Sổ tay sinh viên",
    version="1.0.0",
    lifespan=lifespan
)

# Đảm bảo thư mục static tồn tại trước khi mount
_STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
os.makedirs(_STATIC_DIR, exist_ok=True)
os.makedirs(os.path.join(_STATIC_DIR, "data"), exist_ok=True)
os.makedirs(os.path.join(_STATIC_DIR, "uploads"), exist_ok=True)

# Phân phối file tĩnh (Bản đồ, ảnh...)
app.mount("/static", StaticFiles(directory=_STATIC_DIR), name="static")

# Cấu hình CORS
def _parse_cors_origins() -> list[str]:
    raw = os.getenv(
        "CORS_ORIGINS", 
        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,https://admin.covit.site,https://covit.site"
    ).strip()
    return [o.strip() for o in raw.split(",") if o.strip()]

# Cấu hình CORS - Cho phép toàn bộ subdomain của covit.site
app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors_origins(),
    allow_origin_regex=r"^https?://([a-zA-Z0-9-]+\.)*covit\.site(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Đăng ký các router với prefix /api/admin
app.include_router(admin_documents.router, prefix="/api/admin")
app.include_router(admin_users.router, prefix="/api/admin")
app.include_router(admin_emergency.router, prefix="/api/admin")
app.include_router(admin_calendar.router, prefix="/api/admin")
app.include_router(admin_news.router, prefix="/api/admin")
app.include_router(admin_locations.router, prefix="/api/admin")
app.include_router(admin_services.router, prefix="/api/admin")
app.include_router(admin_map.router, prefix="/api/admin")
app.include_router(admin_upload.router, prefix="/api/admin")
app.include_router(admin_departments.router, prefix="/api/admin")
app.include_router(auth.router)

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "Backend Sổ Tay Sinh Viên"}
