from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime


class AttendanceRecord(BaseModel):
    usn: str
    student_name: str
    status: Optional[str] = None  # "present", "absent", or null


class AttendanceRequest(BaseModel):
    attendance_date: date
    records: List[AttendanceRecord]


class AttendanceResponse(BaseModel):
    id: int
    event_id: int
    usn: str
    student_name: Optional[str] = None
    attendance_date: date
    status: Optional[str] = None
    marked_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EventDateInfo(BaseModel):
    start_date: date
    end_date: date
    dates: List[date]
