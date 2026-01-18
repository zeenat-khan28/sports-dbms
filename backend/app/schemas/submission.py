from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.submission import SubmissionStatus


class SubmissionCreate(BaseModel):
    """Schema for creating a new submission."""
    game_sport_competition: str
    organizing_institution: str
    date_of_activity: str
    year_of_activity: str = "2024"
    
    student_name: str
    parent_name: str
    semester: str
    branch: str
    usn: str
    date_of_birth: str
    
    blood_group: str
    contact_address: str
    phone: str
    mother_name: str
    
    course_name: str
    passing_year_puc: str
    date_first_admission_course: str
    date_first_admission_class: str
    
    previous_game: Optional[str] = None
    previous_years: Optional[str] = None
    
    photo_base64: Optional[str] = None
    signature_base64: Optional[str] = None


class SubmissionResponse(BaseModel):
    """Schema for submission response."""
    id: str
    game_sport_competition: str
    organizing_institution: str
    date_of_activity: str
    year_of_activity: str
    
    sln: Optional[int]
    student_name: str
    parent_name: str
    semester: str
    branch: str
    usn: str
    date_of_birth: str
    
    blood_group: str
    contact_address: str
    phone: str
    mother_name: str
    
    course_name: str
    passing_year_puc: str
    date_first_admission_course: str
    date_first_admission_class: str
    
    previous_game: Optional[str]
    previous_years: Optional[str]
    
    photo_base64: Optional[str]
    signature_base64: Optional[str]
    
    status: str
    submitted_at: datetime
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[str]
    rejection_reason: Optional[str]


class SubmissionUpdate(BaseModel):
    """Schema for updating submission status (admin action)."""
    status: SubmissionStatus
    rejection_reason: Optional[str] = None


class SubmissionListResponse(BaseModel):
    """Schema for paginated submission list."""
    submissions: List[SubmissionResponse]
    total: int
    page: int
    per_page: int
