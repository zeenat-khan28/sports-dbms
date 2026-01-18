"""Event Participation API endpoints."""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from bson import ObjectId
from app.db.postgres import get_postgres_session
from app.db.mongodb import get_database
from app.models.sql_models import Event, ApprovedParticipant, User
from app.schemas.schemas import ParticipationCreate, ParticipationResponse, ParticipationUpdate
from app.core.security import get_current_student, get_current_admin_user
from app.core.blockchain import blockchain
from app.services.email_service import email_service

router = APIRouter(prefix="/participation", tags=["Participation"])


def get_participation_collection():
    """Get participation requests collection from MongoDB."""
    db = get_database()
    return db["event_participation_requests"]


@router.post("/", response_model=ParticipationResponse, status_code=status.HTTP_201_CREATED)
async def submit_participation(
    data: ParticipationCreate,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_postgres_session)
):
    """
    Student submits participation request for an event.
    Requires Firebase authentication with @rvce.edu.in email.
    """
    # Verify student auth
    student = await get_current_student(authorization)
    
    # Get event details from PostgreSQL
    result = await db.execute(select(Event).where(Event.id == data.event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if event is still open (hasn't ended)
    if event.end_date < datetime.utcnow().date():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event has already ended"
        )
    
    # Get student's USN from their registration
    collection = get_participation_collection()
    submissions_collection = get_database()["student_submissions"]
    
    # Find student's registration to get USN
    student_reg = await submissions_collection.find_one({
        "$or": [
            {"email": student["email"]},
            {"firebase_uid": student["uid"]}
        ],
        "status": "approved"
    })
    
    if not student_reg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must complete and get approved for student registration first"
        )
    
    usn = student_reg["usn"]
    student_name = student_reg["student_name"]
    
    # Check for duplicate participation
    existing = await collection.find_one({
        "usn": usn,
        "event_id": data.event_id
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted a participation request for this event"
        )
    
    # Create participation request
    participation = {
        "usn": usn,
        "student_name": student_name,
        "event_id": data.event_id,
        "event_name": event.name,
        "status": "pending",
        "submitted_at": datetime.utcnow(),
        "processed_at": None,
        "processed_by": None,
        "blockchain_hash": None
    }
    
    result = await collection.insert_one(participation)
    
    return ParticipationResponse(
        id=str(result.inserted_id),
        usn=usn,
        student_name=student_name,
        event_id=data.event_id,
        event_name=event.name,
        status="pending",
        submitted_at=participation["submitted_at"],
        blockchain_hash=None
    )


@router.get("/my", response_model=List[ParticipationResponse])
async def get_my_participations(
    authorization: str = Header(...)
):
    """Get current student's participation requests."""
    student = await get_current_student(authorization)
    
    # Get student's USN from registration
    submissions_collection = get_database()["student_submissions"]
    student_reg = await submissions_collection.find_one({
        "$or": [
            {"email": student["email"]},
            {"firebase_uid": student["uid"]}
        ]
    })
    
    if not student_reg:
        return []
    
    usn = student_reg["usn"]
    collection = get_participation_collection()
    
    cursor = collection.find({"usn": usn}).sort("submitted_at", -1)
    participations = await cursor.to_list(length=100)
    
    return [
        ParticipationResponse(
            id=str(p["_id"]),
            usn=p["usn"],
            student_name=p["student_name"],
            event_id=p["event_id"],
            event_name=p["event_name"],
            status=p["status"],
            submitted_at=p["submitted_at"],
            blockchain_hash=p.get("blockchain_hash")
        )
        for p in participations
    ]


@router.get("/event/{event_id}", response_model=List[ParticipationResponse])
async def get_event_participations(
    event_id: int,
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all participation requests for an event (Admin only)."""
    collection = get_participation_collection()
    
    query = {"event_id": event_id}
    if status_filter:
        query["status"] = status_filter
    
    cursor = collection.find(query).sort("submitted_at", -1)
    participations = await cursor.to_list(length=500)
    
    return [
        ParticipationResponse(
            id=str(p["_id"]),
            usn=p["usn"],
            student_name=p["student_name"],
            event_id=p["event_id"],
            event_name=p["event_name"],
            status=p["status"],
            submitted_at=p["submitted_at"],
            blockchain_hash=p.get("blockchain_hash")
        )
        for p in participations
    ]


@router.patch("/{participation_id}", response_model=ParticipationResponse)
async def update_participation_status(
    participation_id: str,
    update_data: ParticipationUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_postgres_session)
):
    """
    Update participation status (Admin only).
    Actions: 'selected' or 'dropped'
    Creates blockchain hash for audit trail.
    """
    if update_data.status not in ["selected", "dropped"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'selected' or 'dropped'"
        )
    
    collection = get_participation_collection()
    
    try:
        obj_id = ObjectId(participation_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid participation ID")
    
    participation = await collection.find_one({"_id": obj_id})
    
    if not participation:
        raise HTTPException(status_code=404, detail="Participation request not found")
    
    # Create blockchain hash
    hash_value = blockchain.log_action(
        usn=participation["usn"],
        event_id=participation["event_id"],
        action=update_data.status,
        admin_email=current_user.email,
        event_name=participation["event_name"]
    )
    
    # Update in MongoDB
    await collection.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "status": update_data.status,
                "processed_at": datetime.utcnow(),
                "processed_by": current_user.email,
                "blockchain_hash": hash_value
            }
        }
    )
    
    # Also update/create in PostgreSQL for approved_participants table
    if update_data.status == "selected":
        approved = ApprovedParticipant(
            usn=participation["usn"],
            event_id=participation["event_id"],
            approved_by=current_user.id,
            status="approved",
            blockchain_hash=hash_value,
            approved_at=datetime.utcnow()
        )
        db.add(approved)
        await db.commit()
        
        # Send email notification to student
        submissions_collection = get_database()["student_submissions"]
        student_reg = await submissions_collection.find_one({"usn": participation["usn"]})
        
        if student_reg and student_reg.get("email"):
            email_service.send_single_email(
                to_email=student_reg["email"],
                subject=f"Congratulations! You've been selected for {participation['event_name']}",
                body=f"""
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #1e40af;">🎉 Selection Confirmed!</h2>
                    <p>Dear <strong>{{{{student_name}}}}</strong>,</p>
                    <p>We are pleased to inform you that you have been <strong>selected</strong> for:</p>
                    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <h3 style="margin: 0; color: #1e293b;">{participation['event_name']}</h3>
                    </div>
                    <p>Please report to the Sports Department for further instructions.</p>
                    <p>Best regards,<br>RVCE Sports Department</p>
                </div>
                """,
                recipient_name=participation["student_name"]
            )
    
    updated = await collection.find_one({"_id": obj_id})
    
    return ParticipationResponse(
        id=str(updated["_id"]),
        usn=updated["usn"],
        student_name=updated["student_name"],
        event_id=updated["event_id"],
        event_name=updated["event_name"],
        status=updated["status"],
        submitted_at=updated["submitted_at"],
        blockchain_hash=updated.get("blockchain_hash")
    )
