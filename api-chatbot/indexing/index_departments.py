"""
indexing/index_departments.py
=============================
Standalone CLI Script để quét và vector hóa toàn bộ Phòng ban & Tòa nhà vào Qdrant.

Usage:
    python indexing/index_departments.py
"""

import asyncio
import logging
import sys
import os
from pathlib import Path

# Thêm root dir vào sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from dotenv import load_dotenv
load_dotenv(dotenv_path=ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)-8s] %(name)s — %(message)s"
)
logger = logging.getLogger("IndexDepartmentsCLI")

async def main():
    logger.info("=" * 60)
    logger.info("🚀 BẮT ĐẦU ĐỒNG BỘ VECTOR TOÀN BỘ PHÒNG BAN VÀO QDRANT")
    logger.info("=" * 60)

    from core.department_indexer import index_all_departments
    count = await index_all_departments()

    logger.info("=" * 60)
    logger.info(f"✅ HOÀN TẤT! Đã đồng bộ thành công {count} phòng ban lên Qdrant.")
    logger.info("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
