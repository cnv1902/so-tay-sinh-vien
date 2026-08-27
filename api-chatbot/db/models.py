"""
db/models.py
============
SQLAlchemy ORM models cho LLM configuration và ETL document tracking (Dành cho AI Microservice).
"""
from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, DateTime, Integer, func, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship, backref
from db.connection import Base
import enum

class DocTypeEnum(str, enum.Enum):
    DE_AN = "de_an"
    QUY_CHE = "quy_che"
    DIEM_CHUAN = "diem_chuan"
    HUONG_DAN = "huong_dan"
    HOC_PHI = "hoc_phi"
    DOI_SONG = "doi_song"
    CO_SO_VAT_CHAT = "co_so_vat_chat"
    THANH_TICH = "thanh_tich"
    GIOI_THIEU = "gioi_thieu"
    LICH_SU = "lich_su"
    KHAC = "khac"
    # Legacy support
    HOC_VU = "Học vụ & Đào tạo"
    HANH_CHINH = "Hành chính & Biểu mẫu"
    CHINH_SACH = "Chính sách & Công tác sinh viên"
    KY_TUC_XA = "Ký túc xá & Đời sống"
    QUOC_TE = "Sinh viên Quốc tế"
    DOAN_HOI = "Đoàn Hội & Ngoại khóa"
    IT_SUPPORT = "Hỗ trợ Công nghệ"

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

# =====================================================================
# SỔ TAY SINH VIÊN MODELS (Read-Only for Chatbot)
# =====================================================================

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
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_en: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name_lao: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone_number: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_lao: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float | None] = mapped_column(String(50), nullable=True) # Cast to float when needed
    longitude: Mapped[float | None] = mapped_column(String(50), nullable=True)
    category: Mapped[str] = mapped_column(String(50), default="POLICE")
    ward: Mapped[str | None] = mapped_column(String(100), nullable=True)

class EmergencyTemplate(Base):
    __tablename__ = "emergency_templates"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    message_template: Mapped[str] = mapped_column(Text, nullable=False)

class Location(Base):
    __tablename__ = "locations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    map_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    latitude: Mapped[float | None] = mapped_column(String(50), nullable=True)
    longitude: Mapped[float | None] = mapped_column(String(50), nullable=True)

class News(Base):
    __tablename__ = "news"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    title_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    title_lao: Mapped[str | None] = mapped_column(String(500), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_lao: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

class Building(Base):
    __tablename__ = "buildings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_en: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name_lao: Mapped[str | None] = mapped_column(String(255), nullable=True)
    latitude: Mapped[float] = mapped_column(String(50), nullable=False)
    longitude: Mapped[float] = mapped_column(String(50), nullable=False)
    departments = relationship("Department", back_populates="building")

class Department(Base):
    __tablename__ = "departments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    building_id: Mapped[int | None] = mapped_column(ForeignKey("buildings.id"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_en: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name_lao: Mapped[str | None] = mapped_column(String(255), nullable=True)
    floor: Mapped[str | None] = mapped_column(String(20), nullable=True)
    room_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    function_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    function_description_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    function_description_lao: Mapped[str | None] = mapped_column(Text, nullable=True)
    working_hours: Mapped[str | None] = mapped_column(String(255), nullable=True)
    latitude: Mapped[float | None] = mapped_column(String(50), nullable=True)
    longitude: Mapped[float | None] = mapped_column(String(50), nullable=True)
    is_building: Mapped[bool] = mapped_column(Boolean, default=False)
    
    building = relationship("Building", back_populates="departments")

