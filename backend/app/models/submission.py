from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class SubmissionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class StudentSubmission(BaseModel):
    """Pydantic model for student form submissions (MongoDB document)."""
    
    # Event Info
    game_sport_competition: str = Field(..., description="Game/Sport/Competition name")
    organizing_institution: str = Field(..., description="Organizing Institution")
    date_of_activity: str = Field(..., description="Date of Activity")
    year_of_activity: str = Field(default="2024", description="Year of activity")
    
    # Student Info
    sln: Optional[int] = Field(None, description="Serial Number (auto-assigned)")
    student_name: str = Field(..., description="Name of the Student")
    parent_name: str = Field(..., description="S/o, D/o (Parent name)")
    semester: str = Field(..., description="Current Semester")
    branch: str = Field(..., description="Branch/Department")
    usn: str = Field(..., description="University Seat Number")
    date_of_birth: str = Field(..., description="Date of Birth")
    
    # Contact Info
    blood_group: str = Field(..., description="Blood Group")
    contact_address: str = Field(..., description="Contact Address")
    phone: str = Field(..., description="Phone/Cell Number")
    mother_name: str = Field(..., description="Mother's Name")
    
    # Academic Info
    course_name: str = Field(..., description="Name of the Course")
    passing_year_puc: str = Field(..., description="Passing year of 10+2/PUC/Diploma")
    date_first_admission_course: str = Field(..., description="Date of first admission to present course")
    date_first_admission_class: str = Field(..., description="Date of first admission to present class/Sem")
    
    # Previous Participation
    previous_game: Optional[str] = Field(None, description="Previous Game participated")
    previous_years: Optional[str] = Field(None, description="Previous Years of participation")
    
    # Uploads (Base64 encoded)
    photo_base64: Optional[str] = Field(None, description="Student Photo (Base64)")
    signature_base64: Optional[str] = Field(None, description="Student Signature (Base64)")
    
    # Status & Metadata
    status: SubmissionStatus = Field(default=SubmissionStatus.PENDING)
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    rejection_reason: Optional[str] = None

    class Config:
        use_enum_values = True


class SubmissionInDB(StudentSubmission):
    """Submission with MongoDB _id."""
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True
