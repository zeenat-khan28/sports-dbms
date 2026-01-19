"""Pydantic schemas for API request/response validation."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


# ==================== AUTH ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== EVENTS ====================

class EventCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    location: Optional[str] = None
    start_date: date
    end_date: date
    description: Optional[str] = None


class EventUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None


class EventResponse(BaseModel):
    id: int
    name: str
    location: Optional[str]
    start_date: date
    end_date: date
    description: Optional[str]
    created_at: datetime
    participant_count: int = 0

    class Config:
        from_attributes = True


# ==================== STUDENT SUBMISSION ====================

class StudentSubmissionCreate(BaseModel):
    student_name: str
    usn: str
    branch: str
    semester: int = Field(..., ge=1, le=8)
    date_of_birth: str
    contact_address: str
    blood_group: str
    phone: str
    parent_name: str
    mother_name: str
    aadhaar_number: str
    photo_base64: Optional[str] = None
    signature_base64: Optional[str] = None


class StudentSubmissionUpdate(BaseModel):
    status: Optional[str] = None  # pending, approved, rejected
    rejection_reason: Optional[str] = None
    
    # Editable Fields
    student_name: Optional[str] = None
    usn: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[int] = None
    date_of_birth: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    parent_name: Optional[str] = None
    mother_name: Optional[str] = None
    contact_address: Optional[str] = None
    aadhaar_number: Optional[str] = None
    email: Optional[str] = None


class StudentSubmissionResponse(BaseModel):
    id: str
    student_name: str
    usn: str
    branch: str
    semester: int
    status: str
    sln: Optional[int] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    
    # Personal Details
    date_of_birth: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    parent_name: Optional[str] = None
    mother_name: Optional[str] = None
    aadhaar_number: Optional[str] = None
    contact_address: Optional[str] = None
    email: Optional[str] = None
    
    # Files
    photo_base64: Optional[str] = None
    signature_base64: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== EVENT PARTICIPATION ====================

class ParticipationCreate(BaseModel):
    event_id: int


class ParticipationResponse(BaseModel):
    id: str
    usn: str
    student_name: str
    event_id: int
    event_name: str
    status: str
    submitted_at: datetime
    blockchain_hash: Optional[str] = None


class ParticipationUpdate(BaseModel):
    status: str  # selected, dropped


# ==================== EXPORT ====================

class ExportRequest(BaseModel):
    event_id: Optional[int] = None
    status: Optional[str] = "approved"
    include_header: bool = True
    include_footer: bool = True
