from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

class RecipientFilter(BaseModel):
    semester: Optional[List[int]] = None
    branch: Optional[List[str]] = None
    event_id: Optional[int] = None
    status: Optional[str] = "approved"

class EmailSendRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=255)
    body: str = Field(..., min_length=1)  # HTML supported
    filters: Optional[RecipientFilter] = None
    send_to_all: bool = False
    dry_run: bool = False  # If true, just calculates count

class EmailLogResponse(BaseModel):
    id: int
    admin_id: int
    subject: str
    recipient_count: int
    success_count: int
    sent_at: datetime
    filters_used: str

class EmailPreviewResponse(BaseModel):
    recipient_count: int
    sample_recipients: List[str]  # List of names
    estimated_time: str
