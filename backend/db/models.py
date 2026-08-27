from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, DateTime, Integer, Float, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Tạm thời dùng DeclarativeBase nếu db.connection chưa được tạo
try:
    from db.connection import Base
except ImportError:
    from sqlalchemy.orm import DeclarativeBase
    class Base(DeclarativeBase):
        pass

class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    full_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="Student", nullable=False) # 'Admin' or 'Student'
    nationality: Mapped[str | None] = mapped_column(String(50), nullable=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_active: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    news = relationship("News", back_populates="author", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    title_en: Mapped[str | None] = mapped_column(String(255), nullable=True)
    title_lao: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_lao: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Draft", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    name_en: Mapped[str | None] = mapped_column(String(100), nullable=True)
    name_lao: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_lao: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    category: Mapped[str] = mapped_column(String(50), server_default="POLICE", nullable=False)
    ward: Mapped[str | None] = mapped_column(String(50), nullable=True)

class EmergencyTemplate(Base):
    __tablename__ = "emergency_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    message_template: Mapped[str] = mapped_column(Text, nullable=False)

class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    title_en: Mapped[str | None] = mapped_column(String(255), nullable=True)
    title_lao: Mapped[str | None] = mapped_column(String(255), nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_all_day: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
    is_annual: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_lao: Mapped[str | None] = mapped_column(Text, nullable=True)

class News(Base):
    __tablename__ = "news"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    title_en: Mapped[str | None] = mapped_column(String(255), nullable=True)
    title_lao: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_lao: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    author = relationship("Account", back_populates="news")

class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    map_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    longitude: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    approval_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)

class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    approval_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)

# =====================================================================
# MODELS TỪ API-CHATBOT (Chuyển sang Backend quản lý Schema)
# =====================================================================
import enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import backref

class DocTypeEnum(enum.Enum):
    HOC_VU = "Học vụ & Đào tạo"
    HANH_CHINH = "Hành chính & Biểu mẫu"
    CHINH_SACH = "Chính sách & Công tác sinh viên"
    KY_TUC_XA = "Ký túc xá & Đời sống"
    QUOC_TE = "Sinh viên Quốc tế"
    DOAN_HOI = "Đoàn Hội & Ngoại khóa"
    IT_SUPPORT = "Hỗ trợ Công nghệ"
    KHAC = "Khác"

class LLMProvider(Base):
    __tablename__ = "llm_providers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    api_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    endpoint: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=func.now())

class LLMSlot(Base):
    __tablename__ = "llm_slots"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slot: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(20), nullable=False)
    model_name: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=func.now())

class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    doc_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    uploaded_by: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="processing", nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    full_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    full_content_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    full_content_lao: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=func.now())

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("uploaded_documents.id", ondelete="CASCADE"))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    document = relationship("UploadedDocument", backref=backref("chunks", cascade="all, delete-orphan"))


# =====================================================================
# CAMPUS MAP MODELS: Tòa nhà & Phòng ban (VinhUni Map)
# =====================================================================

class Building(Base):
    """
    Bảng lưu thông tin các tòa nhà / địa điểm lớn trong khuôn viên trường.
    Liên kết với vinhuni_buildings.geojson thông qua trường `geojson_id`.
    """
    __tablename__ = "buildings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)  # VD: "NHA_DIEU_HANH"
    name: Mapped[str] = mapped_column(String(255), nullable=False)                          # Tên tiếng Việt
    name_en: Mapped[str | None] = mapped_column(String(255), nullable=True)                 # Tên tiếng Anh
    name_lao: Mapped[str | None] = mapped_column(String(255), nullable=True)                # Tên tiếng Lào
    geojson_id: Mapped[int | None] = mapped_column(Integer, nullable=True)                  # ID map với vinhuni_buildings.geojson `id` property
    latitude: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)             # Tọa độ centroid để navigate
    longitude: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_floors: Mapped[int] = mapped_column(Integer, default=1)                           # Tổng số tầng
    description: Mapped[str | None] = mapped_column(Text, nullable=True)                    # Mô tả chung

    # 1 Building -> N Departments
    departments = relationship("Department", back_populates="building", cascade="all, delete-orphan")


class Department(Base):
    """
    Bảng lưu thông tin phòng ban, đơn vị trong từng tòa nhà.
    Hỗ trợ tìm kiếm ngữ nghĩa (RAG Tool) + điều hướng bản đồ.
    """
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    building_id: Mapped[int | None] = mapped_column(
        ForeignKey("buildings.id", ondelete="SET NULL"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)                          # "Phòng Đào tạo"
    name_en: Mapped[str | None] = mapped_column(String(255), nullable=True)                 # "Academic Affairs Office"
    name_lao: Mapped[str | None] = mapped_column(String(255), nullable=True)
    code: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)         # Mã phòng ban: "DT", "TC"
    floor: Mapped[str | None] = mapped_column(String(20), nullable=True, default="1")       # "Tầng 1", "Tầng 2"
    room_number: Mapped[str | None] = mapped_column(String(50), nullable=True)              # "P.102", "P.201A"
    phone_number: Mapped[str | None] = mapped_column(String(100), nullable=True)            # SĐT liên hệ
    email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    function_description: Mapped[str | None] = mapped_column(Text, nullable=True)           # Chức năng, thủ tục tiếp nhận
    function_description_en: Mapped[str | None] = mapped_column(Text, nullable=True)        # Bản tiếng Anh
    function_description_lao: Mapped[str | None] = mapped_column(Text, nullable=True)       # Bản tiếng Lào
    working_hours: Mapped[str | None] = mapped_column(String(255), nullable=True)           # "Sáng: 7h30-11h30, Chiều: 13h30-17h00"
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)                    # Tọa độ marker riêng (nếu là POI độc lập)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_building: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)       # True = đây là điểm tòa nhà độc lập
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)          # Ẩn/Hiện trên bản đồ

    # N Departments -> 1 Building
    building = relationship("Building", back_populates="departments")
