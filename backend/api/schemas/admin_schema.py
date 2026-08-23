from pydantic import BaseModel, ConfigDict, computed_field
from typing import Optional, List
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

# ==========================================
# ACCOUNT SCHEMAS
# ==========================================
class AccountBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    role: str
    nationality: Optional[str] = None
    department: Optional[str] = None

class AccountCreate(AccountBase):
    password: str

class AccountUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    nationality: Optional[str] = None
    department: Optional[str] = None
    password: Optional[str] = None

class AccountResponse(AccountBase):
    id: int
    last_active: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# DOCUMENT SCHEMAS
# ==========================================
class DocumentBase(BaseModel):
    title: str
    content: str
    category: str
    status: str

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# EMERGENCY CONTACT SCHEMAS
# ==========================================
class MapLinkRequest(BaseModel):
    url: str

class EmergencyContactBase(BaseModel):
    name: str
    phone_number: str
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: str = "POLICE"
    ward: Optional[str] = None

class EmergencyContactCreate(EmergencyContactBase):
    pass

class EmergencyContactUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: Optional[str] = None
    ward: Optional[str] = None

class EmergencyContactResponse(EmergencyContactBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# EMERGENCY TEMPLATE SCHEMAS
# ==========================================
class EmergencyTemplateBase(BaseModel):
    category: str
    message_template: str

class EmergencyTemplateCreate(EmergencyTemplateBase):
    pass

class EmergencyTemplateUpdate(BaseModel):
    category: Optional[str] = None
    message_template: Optional[str] = None

class EmergencyTemplateResponse(EmergencyTemplateBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# CALENDAR EVENT SCHEMAS
# ==========================================
class CalendarEventBase(BaseModel):
    title: str
    category: str
    start_time: datetime
    end_time: datetime
    is_all_day: bool = True
    is_annual: bool = False
    description: Optional[str] = None

class CalendarEventCreate(CalendarEventBase):
    pass

class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_all_day: Optional[bool] = None
    is_annual: Optional[bool] = None
    description: Optional[str] = None

class CalendarEventResponse(CalendarEventBase):
    id: int

    @computed_field
    @property
    def formatted_start_time(self) -> str:
        vn_tz = ZoneInfo("Asia/Ho_Chi_Minh")
        st = self.start_time.astimezone(vn_tz) if self.start_time.tzinfo else self.start_time.replace(tzinfo=timezone.utc).astimezone(vn_tz)
        if self.is_annual:
            format_str = "%d/%m (Hàng năm)" if self.is_all_day else "%H:%M %d/%m (Hàng năm)"
        else:
            format_str = "%d/%m/%Y" if self.is_all_day else "%H:%M %d/%m/%Y"
        return st.strftime(format_str)

    @computed_field
    @property
    def formatted_end_time(self) -> str:
        vn_tz = ZoneInfo("Asia/Ho_Chi_Minh")
        et = self.end_time.astimezone(vn_tz) if self.end_time.tzinfo else self.end_time.replace(tzinfo=timezone.utc).astimezone(vn_tz)
        if self.is_annual:
            format_str = "%d/%m (Hàng năm)" if self.is_all_day else "%H:%M %d/%m (Hàng năm)"
        else:
            format_str = "%d/%m/%Y" if self.is_all_day else "%H:%M %d/%m/%Y"
        return et.strftime(format_str)

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# NEWS SCHEMAS
# ==========================================
class NewsBase(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    is_pinned: bool = False

class NewsCreate(NewsBase):
    author_id: int

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    is_pinned: Optional[bool] = None

class NewsResponse(NewsBase):
    id: int
    author_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# LOCATION SCHEMAS
# ==========================================
class LocationBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    map_link: Optional[str] = None
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    approval_status: str = "pending"

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    map_link: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    approval_status: Optional[str] = None

class LocationResponse(LocationBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# SERVICE SCHEMAS
# ==========================================
class ServiceBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    approval_status: str = "pending"

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    approval_status: Optional[str] = None

class ServiceResponse(ServiceBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# BUILDING SCHEMAS (VinhUni Map)
# ==========================================
class BuildingBase(BaseModel):
    code: str
    name: str
    name_en: Optional[str] = None
    name_lao: Optional[str] = None
    geojson_id: Optional[int] = None
    latitude: float = 0.0
    longitude: float = 0.0
    total_floors: int = 1
    description: Optional[str] = None

class BuildingCreate(BuildingBase):
    pass

class BuildingUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    name_en: Optional[str] = None
    name_lao: Optional[str] = None
    geojson_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_floors: Optional[int] = None
    description: Optional[str] = None

class BuildingResponse(BuildingBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class BuildingWithDepartmentsResponse(BuildingBase):
    id: int
    departments: List["DepartmentResponse"] = []
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# DEPARTMENT SCHEMAS (VinhUni Map)
# ==========================================
class DepartmentBase(BaseModel):
    name: str
    name_en: Optional[str] = None
    name_lao: Optional[str] = None
    code: Optional[str] = None
    floor: Optional[str] = "1"
    room_number: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    function_description: Optional[str] = None
    function_description_en: Optional[str] = None
    function_description_lao: Optional[str] = None
    working_hours: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_building: bool = False
    is_active: bool = True
    building_id: Optional[int] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    name_lao: Optional[str] = None
    code: Optional[str] = None
    floor: Optional[str] = None
    room_number: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    function_description: Optional[str] = None
    function_description_en: Optional[str] = None
    function_description_lao: Optional[str] = None
    working_hours: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_building: Optional[bool] = None
    is_active: Optional[bool] = None
    building_id: Optional[int] = None

class DepartmentResponse(DepartmentBase):
    id: int
    building: Optional[BuildingResponse] = None
    model_config = ConfigDict(from_attributes=True)
