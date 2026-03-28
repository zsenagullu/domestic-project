from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Enum, DateTime, Float, JSON
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from database import Base

class RoleEnum(str, enum.Enum):
    customer = "customer" # Müşteri
    worker = "worker"     # Çalışan / Personel

class JobStatusEnum(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"

class ServiceTypeEnum(str, enum.Enum):
    DIRECT_BOOKING = "DIRECT_BOOKING"
    MARKETPLACE_BIDDING = "MARKETPLACE_BIDDING"

class OfferStatusEnum(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.customer)
    
    # Domates spesiifk özellikleri (Customer / Staff ortak özellikleri veya null kalabilecek)
    allergy_info = Column(Text, nullable=True) # Alerji bilgisi
    has_criminal_record = Column(Boolean, default=False) # Adli sicil durumu

    # Personel rolleri için özellikler
    hourly_rate = Column(Float, nullable=True) # float >= 0
    rating = Column(Float, nullable=True) # float 1-5
    skills = Column(JSON, nullable=True) # JSON/List
    
    # Yeni eklenen özellikler
    gender = Column(String, nullable=True)
    location = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    jobs = relationship("Job", back_populates="owner")
    offers = relationship("Offer", back_populates="staff_member")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    photo_url = Column(String, nullable=True)
    description = Column(Text)
    status = Column(Enum(JobStatusEnum), default=JobStatusEnum.open)
    service_type = Column(Enum(ServiceTypeEnum), nullable=False)
    location = Column(String, nullable=True)
    house_size = Column(String, nullable=True)
    price = Column(Float, nullable=True)
    
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="jobs")
    offers = relationship("Offer", back_populates="job")

class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    offered_price = Column(Float, nullable=False) # float > 0
    message = Column(Text, nullable=False)
    estimated_time = Column(String, nullable=False)
    status = Column(Enum(OfferStatusEnum), default=OfferStatusEnum.pending)
    
    job_id = Column(Integer, ForeignKey("jobs.id"))
    user_id = Column(Integer, ForeignKey("users.id")) # Personel / Teklif veren
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("Job", back_populates="offers")
    staff_member = relationship("User", back_populates="offers")
