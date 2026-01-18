"""Attendance API endpoints."""
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.db.postgres import get_postgres_session
from app.db.mongodb import get_database
from app.models.sql_models import Event, EventAttendance, User
from app.schemas.attendance_schemas import (
    AttendanceRequest, AttendanceResponse, EventDateInfo
)
from app.core.security import get_current_admin_user

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.get("/{event_id}/dates", response_model=EventDateInfo)
async def get_event_dates(
    event_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_postgres_session)
):
    """Get the date range for an event."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Generate list of dates between start and end
    dates = []
    current_date = event.start_date
    while current_date <= event.end_date:
        dates.append(current_date)
        current_date += timedelta(days=1)
    
    return EventDateInfo(
        start_date=event.start_date,
        end_date=event.end_date,
        dates=dates
    )


@router.get("/{event_id}", response_model=List[AttendanceResponse])
async def get_attendance(
    event_id: int,
    attendance_date: str = None,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_postgres_session)
):
    """Get attendance records for an event, optionally filtered by date."""
    # Verify event exists
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get approved participants from MongoDB
    participation_collection = get_database()["event_participation_requests"]
    cursor = participation_collection.find({
        "event_id": event_id,
        "status": "selected"
    })
    participants = await cursor.to_list(length=500)
    
    if not participants:
        return []
    
    # Get existing attendance records
    query = select(EventAttendance).where(EventAttendance.event_id == event_id)
    if attendance_date:
        from datetime import date as date_type
        parsed_date = date_type.fromisoformat(attendance_date)
        query = query.where(EventAttendance.attendance_date == parsed_date)
    
    result = await db.execute(query)
    existing_records = {(r.usn, r.attendance_date): r for r in result.scalars().all()}
    
    # Build response - include all participants, with existing attendance if any
    response = []
    target_date = date_type.fromisoformat(attendance_date) if attendance_date else event.start_date
    
    for p in participants:
        key = (p["usn"], target_date)
        if key in existing_records:
            record = existing_records[key]
            response.append(AttendanceResponse(
                id=record.id,
                event_id=event_id,
                usn=record.usn,
                student_name=record.student_name or p.get("student_name", ""),
                attendance_date=record.attendance_date,
                status=record.status,
                marked_at=record.marked_at
            ))
        else:
            # No record yet - create placeholder
            response.append(AttendanceResponse(
                id=0,
                event_id=event_id,
                usn=p["usn"],
                student_name=p.get("student_name", ""),
                attendance_date=target_date,
                status=None,
                marked_at=None
            ))
    
    return response


@router.post("/{event_id}")
async def save_attendance(
    event_id: int,
    request: AttendanceRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_postgres_session)
):
    """Save or update attendance records for an event on a specific date."""
    # Verify event exists
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    saved_count = 0
    
    for record in request.records:
        # Check if record exists
        existing = await db.execute(
            select(EventAttendance).where(and_(
                EventAttendance.event_id == event_id,
                EventAttendance.usn == record.usn,
                EventAttendance.attendance_date == request.attendance_date
            ))
        )
        existing_record = existing.scalar_one_or_none()
        
        if existing_record:
            # Update
            existing_record.status = record.status
            existing_record.marked_by = current_user.id
            existing_record.marked_at = datetime.utcnow()
        else:
            # Insert
            new_record = EventAttendance(
                event_id=event_id,
                usn=record.usn,
                student_name=record.student_name,
                attendance_date=request.attendance_date,
                status=record.status,
                marked_by=current_user.id,
                marked_at=datetime.utcnow()
            )
            db.add(new_record)
        
        saved_count += 1
    
    await db.commit()
    
    return {"message": f"Saved {saved_count} attendance records", "saved_count": saved_count}
