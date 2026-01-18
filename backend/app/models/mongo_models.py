"""Pydantic models for MongoDB documents."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class SubmissionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class StudentSubmission(BaseModel):
    """Student registration submission stored in MongoDB."""
    # Personal Info
    student_name: str
    usn: str
    branch: str
    semester: int
    date_of_birth: str
    contact_address: str
    blood_group: str
    phone: str
    parent_name: str
    mother_name: str
    
    # Uploads (Base64 encoded)
    photo_base64: Optional[str] = None
    signature_base64: Optional[str] = None
    
    # Status
    status: SubmissionStatus = SubmissionStatus.PENDING
    rejection_reason: Optional[str] = None
    sln: Optional[int] = None  # Serial number assigned on approval
    
    # Metadata
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    
    class Config:
        use_enum_values = True


class EventParticipationRequest(BaseModel):
    """Event participation request stored in MongoDB."""
    usn: str
    student_name: str
    event_id: int  # References PostgreSQL events table
    event_name: str
    status: str = "pending"  # pending, selected, dropped
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None
    processed_by: Optional[str] = None
    blockchain_hash: Optional[str] = None
