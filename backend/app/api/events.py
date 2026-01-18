"""Events API endpoints."""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.postgres import get_postgres_session
from app.db.mongodb import get_database
from app.models.sql_models import Event, User, ApprovedParticipant
from app.schemas.schemas import EventCreate, EventUpdate, EventResponse
from app.core.security import get_current_admin_user
from app.services.email_service import email_service
from fastapi.concurrency import run_in_threadpool

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_postgres_session)
):
    """Create a new event (Admin only)."""
    if event_data.end_date < event_data.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date cannot be before start date"
        )
    
    new_event = Event(
        name=event_data.name,
        location=event_data.location,
        start_date=event_data.start_date,
        end_date=event_data.end_date,
        description=event_data.description,
        created_by=current_user.id
    )
    
    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)
    
    # Send email notification to all approved students
    submissions_collection = get_database()["student_submissions"]
    cursor = submissions_collection.find({"status": "approved"})
    approved_students = await cursor.to_list(length=1000)
    
    if approved_students:
        recipients_data = []
        for student in approved_students:
            email = student.get("email")
            if email and "@" in email:
                recipients_data.append({
                    "email": email,
                    "name": student.get("student_name", "Student"),
                    "usn": student.get("usn", ""),
                    "branch": student.get("branch", ""),
                    "semester": student.get("semester", "")
                })
        
        if recipients_data:
            # Send in background to not block response
            email_body = f"""
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #1e40af;">🏆 New Sports Event Announced!</h2>
                <p>Dear <strong>{{{{student_name}}}}</strong>,</p>
                <p>A new sports event has been announced:</p>
                <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h3 style="margin: 0; color: #1e293b;">{new_event.name}</h3>
                    <p style="margin: 8px 0 0 0; color: #64748b;">📍 {new_event.location or 'TBD'}</p>
                    <p style="margin: 4px 0 0 0; color: #64748b;">📅 {new_event.start_date} - {new_event.end_date}</p>
                </div>
                <p>Log in to the Student Portal to register your participation.</p>
                <p>Best regards,<br>RVCE Sports Department</p>
            </div>
            """
            await run_in_threadpool(
                email_service.send_batch,
                recipients_data,
                f"New Event: {new_event.name} - RVCE Sports",
                email_body
            )
    
    return EventResponse(
        id=new_event.id,
        name=new_event.name,
        location=new_event.location,
        start_date=new_event.start_date,
        end_date=new_event.end_date,
        description=new_event.description,
        created_at=new_event.created_at,
        participant_count=0
    )


@router.get("/", response_model=List[EventResponse])
async def list_events(
    upcoming_only: bool = Query(False, description="Filter to upcoming events only"),
    db: AsyncSession = Depends(get_postgres_session)
):
    """List all events (Public - visible to students)."""
    query = select(Event).order_by(Event.start_date.desc())
    
    if upcoming_only:
        # Use date only, no timezone issues
        from datetime import date
        today = date.today()
        query = query.where(Event.end_date >= today)
    
    result = await db.execute(query)
    events = result.scalars().all()
    
    # Get participant counts
    response = []
    for event in events:
        count_result = await db.execute(
            select(func.count(ApprovedParticipant.id))
            .where(ApprovedParticipant.event_id == event.id)
            .where(ApprovedParticipant.status == "selected")
        )
        count = count_result.scalar() or 0
        
        response.append(EventResponse(
            id=event.id,
            name=event.name,
            location=event.location,
            start_date=event.start_date,
            end_date=event.end_date,
            description=event.description,
            created_at=event.created_at,
            participant_count=count
        ))
    
    return response


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: int,
    db: AsyncSession = Depends(get_postgres_session)
):
    """Get a single event by ID."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    count_result = await db.execute(
        select(func.count(ApprovedParticipant.id))
        .where(ApprovedParticipant.event_id == event.id)
        .where(ApprovedParticipant.status == "selected")
    )
    count = count_result.scalar() or 0
    
    return EventResponse(
        id=event.id,
        name=event.name,
        location=event.location,
        start_date=event.start_date,
        end_date=event.end_date,
        description=event.description,
        created_at=event.created_at,
        participant_count=count
    )


@router.patch("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    update_data: EventUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_postgres_session)
):
    """Update an event (Admin only)."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(event, key, value)
    
    await db.commit()
    await db.refresh(event)
    
    return EventResponse(
        id=event.id,
        name=event.name,
        location=event.location,
        start_date=event.start_date,
        end_date=event.end_date,
        description=event.description,
        created_at=event.created_at,
        participant_count=0
    )


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_postgres_session)
):
    """Delete an event (Admin only)."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Delete related ApprovedParticipants from PostgreSQL
    await db.execute(
        ApprovedParticipant.__table__.delete().where(ApprovedParticipant.event_id == event_id)
    )
    
    # Delete related participation requests from MongoDB
    participation_collection = get_database()["event_participation_requests"]
    await participation_collection.delete_many({"event_id": event_id})
    
    # Now delete the event
    await db.delete(event)
    await db.commit()

