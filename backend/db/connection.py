"""
db/connection.py
================
SQLAlchemy async engine và session factory.
Dùng asyncpg driver cho PostgreSQL.

DATABASE_URL được đọc từ biến môi trường:
  - Khi chạy trong Docker: docker-compose.yml inject URL với hostname "postgres"
  - Khi chạy local:        .env cung cấp URL với hostname "localhost"
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://chatbot_user:chatbot_pass@localhost:5432/chatbot_db",
)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,    # Kiểm tra connection trước khi dùng, tránh lỗi stale
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class cho tất cả ORM models."""
    pass


async def get_db():
    """
    FastAPI dependency — yield async session, đảm bảo đóng sau request.

    Usage trong router:
        @router.get("/example")
        async def handler(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


import logging
logger = logging.getLogger(__name__)

async def init_db() -> None:
    """
    Tạo tất cả tables từ ORM models.
    Idempotent — gọi nhiều lần không có tác dụng phụ.
    Gọi trong startup hook của FastAPI (api/main.py).
    """
    async with engine.begin() as conn:
        # Import models để SQLAlchemy biết cần tạo table nào
        from db import models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)

        from sqlalchemy import inspect, text
        
        def upgrade_schema(sync_conn):
            inspector = inspect(sync_conn)
            for table_name, table in Base.metadata.tables.items():
                if inspector.has_table(table_name):
                    existing_columns = [col['name'] for col in inspector.get_columns(table_name)]
                    for column in table.columns:
                        if column.name not in existing_columns:
                            col_type = column.type.compile(engine.dialect)
                            sync_conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column.name} {col_type}"))
                            logger.info(f"[Schema Upgrade] Tự động thêm cột '{column.name}' vào bảng '{table_name}'")

        await conn.run_sync(upgrade_schema)
