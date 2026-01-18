"""Analytics API endpoints for dashboard insights."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import Dict, List, Any
from datetime import datetime

from app.db.postgres import get_postgres_session
from app.db.mongodb import get_database, get_submissions_collection
from app.models.sql_models import Event, EventAttendance, User
from app.core.security import get_current_admin_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
async def get_analytics_overview(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_postgres_session)
) -> Dict[str, Any]:
    """Get high-level KPIs for dashboard."""
    
    # Total approved students (from MongoDB)
    submissions_collection = get_submissions_collection()
    total_students = await submissions_collection.count_documents({"status": "approved"})
    
    # Total events
    events_result = await db.execute(select(func.count(Event.id)))
    total_events = events_result.scalar() or 0
    
    # Total registrations (selected participants from MongoDB)
    participation_collection = get_database()["event_participation_requests"]
    total_registrations = await participation_collection.count_documents({"status": "selected"})
    
    # Average attendance rate - calculated via Python for safety
    total_attendance_records = 0
    present_count = 0
    
    attendance_all = await db.execute(select(EventAttendance))
    for record in attendance_all.scalars().all():
        total_attendance_records += 1
        if record.status and record.status.lower() == "present":
            present_count += 1
    
    avg_attendance = round((present_count / total_attendance_records * 100), 1) if total_attendance_records > 0 else 0
    
    return {
        "total_students": total_students,
        "total_events": total_events,
        "total_registrations": total_registrations,
        "avg_attendance_rate": avg_attendance
    }


@router.get("/participation")
async def get_participation_analytics(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_postgres_session)
) -> Dict[str, Any]:
    """Get participation breakdown analytics."""
    
    # Event-wise participation (sport-wise)
    participation_collection = get_database()["event_participation_requests"]
    
    # Get all events
    events_result = await db.execute(select(Event))
    events = {e.id: e.name for e in events_result.scalars().all()}
    
    # Count per event
    event_participation = []
    for event_id, event_name in events.items():
        count = await participation_collection.count_documents({
            "event_id": event_id,
            "status": "selected"
        })
        if count > 0:
            event_participation.append({"name": event_name, "participants": count})
    
    # Sort by participants descending
    event_participation.sort(key=lambda x: x["participants"], reverse=True)
    
    # Branch-wise distribution (from MongoDB submissions)
    submissions_collection = get_submissions_collection()
    cursor = submissions_collection.find({"status": "approved"})
    students = await cursor.to_list(length=2000)
    
    branch_counts = {}
    semester_counts = {}
    
    for s in students:
        branch = s.get("branch", "Unknown")
        semester = str(s.get("semester", "Unknown"))
        branch_counts[branch] = branch_counts.get(branch, 0) + 1
        semester_counts[semester] = semester_counts.get(semester, 0) + 1
    
    branch_distribution = [{"name": k, "value": v} for k, v in branch_counts.items()]
    semester_distribution = [{"semester": k, "count": v} for k, v in sorted(semester_counts.items())]
    
    return {
        "event_participation": event_participation[:10],  # Top 10
        "branch_distribution": branch_distribution,
        "semester_distribution": semester_distribution
    }


@router.get("/events")
async def get_event_analytics(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_postgres_session)
) -> Dict[str, Any]:
    """Get event-related analytics."""
    
    # Events over time
    events_result = await db.execute(
        select(Event).order_by(Event.start_date)
    )
    events = events_result.scalars().all()
    
    participation_collection = get_database()["event_participation_requests"]
    
    event_trend = []
    top_events = []
    
    for event in events:
        count = await participation_collection.count_documents({
            "event_id": event.id,
            "status": "selected"
        })
        
        event_trend.append({
            "date": event.start_date.strftime("%Y-%m-%d") if event.start_date else "",
            "name": event.name,
            "participants": count
        })
        
        top_events.append({
            "name": event.name,
            "participants": count
        })
    
    # Sort top events
    top_events.sort(key=lambda x: x["participants"], reverse=True)
    
    return {
        "event_trend": event_trend,
        "top_events": top_events[:5]
    }


@router.get("/attendance")
async def get_attendance_analytics(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_postgres_session)
) -> Dict[str, Any]:
    """Get attendance analytics per event."""
    
    # Get all events
    events_result = await db.execute(select(Event))
    events = {e.id: e.name for e in events_result.scalars().all()}
    
    # Get attendance records
    attendance_result = await db.execute(select(EventAttendance))
    records = attendance_result.scalars().all()
    
    # Calculate per-event attendance rates
    event_stats = {}
    for r in records:
        if r.event_id not in event_stats:
            event_stats[r.event_id] = {"total": 0, "present": 0}
        event_stats[r.event_id]["total"] += 1
        if r.status and r.status.lower() == "present":
            event_stats[r.event_id]["present"] += 1
    
    attendance_rates = []
    for event_id, stats in event_stats.items():
        event_name = events.get(event_id, f"Event {event_id}")
        rate = round((stats["present"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0
        attendance_rates.append({
            "name": event_name,
            "rate": rate,
            "present": stats["present"],
            "total": stats["total"]
        })
    
    # Sort by rate descending
    attendance_rates.sort(key=lambda x: x["rate"], reverse=True)
    
    return {
        "attendance_rates": attendance_rates
    }
