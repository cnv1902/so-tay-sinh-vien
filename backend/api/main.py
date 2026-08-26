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

@asynccontextmanager
async def lifespan(app: FastAPI):
    from db.connection import init_db
    await init_db()
    await seed_admin_account()
    
    # Khởi tạo đồ thị cho chức năng tìm đường
    from core.map_engine import map_engine
    import os
    geojson_path = os.path.join(os.path.dirname(__file__), "..", "static", "data", "vinhuni_paths.geojson")
    walkable_path = os.path.join(os.path.dirname(__file__), "..", "static", "data", "vinhuni_walkable_areas.geojson")
    buildings_path = os.path.join(os.path.dirname(__file__), "..", "static", "data", "vinhuni_buildings.geojson")
    map_engine.load_graph(geojson_path, walkable_path, buildings_path)
    
    yield

app = FastAPI(
    title="Sổ Tay Sinh Viên Backend",
    description="Greenfield project cho các module Quản trị, Tiện ích của Sổ tay sinh viên",
    version="1.0.0",
    lifespan=lifespan
)

# Phân phối file tĩnh (Bản đồ, ảnh...)
app.mount("/static", StaticFiles(directory="static"), name="static")

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
