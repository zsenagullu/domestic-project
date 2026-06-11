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
    worker = "worker"

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
    photo_url: Optional[str] = None
    bio: Optional[str] = None
    
    # Personel rolleri için özellikler
    hourly_rate: Optional[float] = Field(default=None, ge=0.0, description="Saatlik ücret (float >= 0)")
    rating: Optional[float] = Field(default=None, ge=1.0, le=5.0, description="Puan (1-5 arası)")
    skills: Optional[List[str]] = Field(default=None, description="Yetkinlikler listesi")
    
    # Abonelik bilgileri
    subscription_plan: Optional[str] = None
    subscription_expires_at: Optional[datetime] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    offer_id: int
    worker_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: int
    offer_id: int
    reviewer_id: int
    worker_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    reviewer: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    location: Optional[str] = None
    hourly_rate: Optional[float] = Field(default=None, ge=0.0, description="Saatlik ücret (float >= 0)")
    skills: Optional[List[str]] = Field(default=None, description="Yetkinlikler listesi")
    bio: Optional[str] = None

class UserPhotoUpload(BaseModel):
    photo: str

class WorkerMatchResponse(BaseModel):
    id: int
    name: str
    location: Optional[str] = None
    hourly_rate: Optional[float] = None
    rating: Optional[float] = None
    skills: Optional[List[str]] = None
    photo_url: Optional[str] = None
    bio: Optional[str] = None
    
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
    cleaning_type: Optional[str] = None
    preferred_date: Optional[str] = None
    has_pets: Optional[bool] = False
    has_allergies: Optional[bool] = False
    special_notes: Optional[str] = None

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    status: JobStatusEnum

class JobUpdateFull(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    house_size: Optional[str] = None
    price: Optional[float] = None

class JobMinResponse(JobBase):
    id: int
    status: JobStatusEnum
    user_id: int
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
    job: Optional[JobMinResponse] = None
    worker: Optional[UserResponse] = None
    reviews: List[ReviewResponse] = []
    class Config:
        from_attributes = True

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

class DirectRequestCreate(BaseModel):
    worker_id: int
    job_id: int

class DirectRequestStatusUpdate(BaseModel):
    status: str

class DirectRequestResponse(BaseModel):
    id: int
    customer_id: int
    worker_id: int
    job_id: int
    status: str
    created_at: datetime
    customer: Optional[UserResponse] = None
    job: Optional[JobMinResponse] = None
    
    class Config:
        from_attributes = True

class SubscribeRequest(BaseModel):
    plan: str

class PlanDetail(BaseModel):
    id: str
    name: str
    price: float
    features: List[str]

class UserSubscriptionInfo(BaseModel):
    plan: Optional[str] = None
    expires_at: Optional[datetime] = None
