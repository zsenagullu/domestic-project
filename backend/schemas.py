from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class ServiceTypeEnum(str, Enum):
    DIRECT_BOOKING = "DIRECT_BOOKING"
    MARKETPLACE_BIDDING = "MARKETPLACE_BIDDING"
class RoleEnum(str, Enum):
    customer = "customer"
    staff = "staff"

class JobStatusEnum(str, Enum):
    open = "open"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"

class OfferStatusEnum(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


# -- USER SCHEMAS --
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: RoleEnum
    allergy_info: Optional[str] = None
    has_criminal_record: Optional[bool] = False
    gender: Optional[str] = None
    location: Optional[str] = None
    
    # Personel rolleri için özellikler
    hourly_rate: Optional[float] = Field(default=None, ge=0.0, description="Saatlik ücret (float >= 0)")
    rating: Optional[float] = Field(default=None, ge=1.0, le=5.0, description="Puan (1-5 arası)")
    skills: Optional[List[str]] = Field(default=None, description="Yetkinlikler listesi")

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# -- OFFER SCHEMAS --
class OfferBase(BaseModel):
    offered_price: float = Field(..., gt=0, description="Teklif fiyatı (float > 0)")
    message: str
    estimated_time: str

class OfferCreate(OfferBase):
    job_id: int

class OfferUpdate(BaseModel):
    status: OfferStatusEnum

class OfferResponse(OfferBase):
    id: int
    status: OfferStatusEnum
    job_id: int
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# -- JOB SCHEMAS --
class JobBase(BaseModel):
    title: str
    description: str
    photo_url: Optional[str] = None
    service_type: ServiceTypeEnum
    location: Optional[str] = None
    house_size: Optional[str] = None
    price: Optional[float] = None

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    status: JobStatusEnum

class JobResponse(JobBase):
    id: int
    status: JobStatusEnum
    user_id: int
    created_at: datetime
    offers: List[OfferResponse] = []
    class Config:
        from_attributes = True

# JWT Token
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
