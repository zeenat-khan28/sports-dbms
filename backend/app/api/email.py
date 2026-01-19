from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.postgres import get_postgres_session
from app.db.mongodb import get_database
from app.models.sql_models import EmailAuditLog, User
from app.core.security import get_current_admin_user
from app.schemas.email_schemas import EmailSendRequest, EmailLogResponse
from app.services.email_service import email_service
from fastapi.concurrency import run_in_threadpool
import hashlib
import json
from datetime import datetime
from typing import List

router = APIRouter(prefix="/email", tags=["email"])


def get_submissions_collection():
    """Get student submissions collection from MongoDB."""
    db = get_database()
    return db["student_submissions"]


@router.post("/send", response_model=EmailLogResponse)
async def send_email(
    request: EmailSendRequest,
    current_admin: User = Depends(get_current_admin_user),
    session: AsyncSession = Depends(get_postgres_session)
):
    # 1. Build MongoDB Query for approved students
    collection = get_submissions_collection()
    
    query = {"status": "approved"}  # Only approved students
    
    filters_dict = {}
    if request.filters:
        filters_dict = request.filters.dict(exclude_none=True)
        
        if request.filters.semester:
            if isinstance(request.filters.semester, list) and len(request.filters.semester) > 0:
                query["semester"] = {"$in": request.filters.semester}
            elif isinstance(request.filters.semester, int):
                query["semester"] = request.filters.semester
                
        if request.filters.branch:
            if isinstance(request.filters.branch, list) and len(request.filters.branch) > 0:
                query["branch"] = {"$in": request.filters.branch}
        
        if request.filters.usn:
            if isinstance(request.filters.usn, list) and len(request.filters.usn) > 0:
                query["usn"] = {"$in": request.filters.usn}
    
    # Execute Query
    cursor = collection.find(query)
    students = await cursor.to_list(length=1000)
    
    recipient_count = len(students)
    
    # 2. Dry Run
    if request.dry_run:
        return EmailLogResponse(
            id=0,
            admin_id=current_admin.id,
            subject=request.subject,
            recipient_count=recipient_count,
            success_count=0,
            sent_at=datetime.utcnow(),
            filters_used=json.dumps(filters_dict)
        )
    
    if recipient_count == 0:
        raise HTTPException(status_code=400, detail="No approved students found matching filters")

    # 3. Prepare Recipients Data
    recipients_data = []
    for student in students:
        email = student.get("email")
        if email and "@" in email:
            recipients_data.append({
                "email": email,
                "name": student.get("student_name", "Student"),
                "usn": student.get("usn", "N/A"),
                "branch": student.get("branch", "N/A"),
                "semester": student.get("semester", "")
            })
    
    if len(recipients_data) == 0:
        raise HTTPException(status_code=400, detail="No valid email addresses found")
    
    # 4. Find Last Hash for Blockchain
    last_log_result = await session.execute(
        select(EmailAuditLog).order_by(desc(EmailAuditLog.id)).limit(1)
    )
    last_log = last_log_result.scalar_one_or_none()
    prev_hash = last_log.blockchain_hash if last_log else "GENESIS_HASH"
    
    # 5. Create Initial Log
    new_log = EmailAuditLog(
        admin_id=current_admin.id,
        subject=request.subject,
        body_preview=request.body[:100] + "...",
        filters_used=json.dumps(filters_dict),
        recipient_count=len(recipients_data),
        success_count=0,
        failure_count=0,
        sent_at=datetime.utcnow(),
        blockchain_hash="PENDING"
    )
    session.add(new_log)
    await session.commit()
    await session.refresh(new_log)
    
    # 6. Send Emails (Blocking in Threadpool)
    success, failure = await run_in_threadpool(
        email_service.send_batch,
        recipients_data, 
        request.subject, 
        request.body
    )
    
    # 7. Update Log & Compute Hash
    new_log.success_count = success
    new_log.failure_count = failure
    
    # Hash = SHA256(prev_hash + admin_id + timestamp + subject + success_count)
    data_to_hash = f"{prev_hash}{new_log.admin_id}{new_log.sent_at.isoformat()}{new_log.subject}{success}"
    new_log.blockchain_hash = hashlib.sha256(data_to_hash.encode()).hexdigest()
    
    await session.commit()
    
    return EmailLogResponse(
        id=new_log.id,
        admin_id=new_log.admin_id,
        subject=new_log.subject,
        recipient_count=new_log.recipient_count,
        success_count=success,
        sent_at=new_log.sent_at,
        filters_used=new_log.filters_used
    )


@router.get("/logs", response_model=List[EmailLogResponse])
async def get_email_logs(
    session: AsyncSession = Depends(get_postgres_session),
    current_admin: User = Depends(get_current_admin_user)
):
    result = await session.execute(select(EmailAuditLog).order_by(desc(EmailAuditLog.sent_at)))
    return result.scalars().all()
