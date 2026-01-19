"""Student Submissions API endpoints."""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from bson import ObjectId
from app.db.mongodb import get_database
from app.models.sql_models import User
from app.schemas.schemas import (
    StudentSubmissionCreate, StudentSubmissionUpdate, StudentSubmissionResponse
)
from app.core.security import get_current_admin_user, get_current_student
from app.core.blockchain import blockchain

from pymongo.errors import DuplicateKeyError

router = APIRouter(prefix="/submissions", tags=["Student Submissions"])


def get_submissions_collection():
    """Get submissions collection from MongoDB."""
    db = get_database()
    return db["student_submissions"]


@router.post("/", response_model=StudentSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    submission: StudentSubmissionCreate,
    authorization: str = Header(...)
):
    """
    Create a new student submission.
    Requires Firebase authentication with @rvce.edu.in email.
    """
    # Verify student auth
    student = await get_current_student(authorization)
    
    collection = get_submissions_collection()
    
    # Check for duplicate USN
    existing = await collection.find_one({"usn": submission.usn.upper()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A submission with USN {submission.usn} already exists"
        )
    
    # Create submission document
    doc = {
        **submission.model_dump(),
        "usn": submission.usn.upper(),
        "status": "pending",
        "sln": None,
        "rejection_reason": None,
        "submitted_at": datetime.utcnow(),
        "reviewed_at": None,
        "reviewed_by": None,
        "email": student["email"],
        "firebase_uid": student["uid"]
    }
    
    try:
        result = await collection.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Duplicate submission: A student with USN {submission.usn} has already submitted."
        )
    
    return StudentSubmissionResponse(
        id=str(result.inserted_id),
        student_name=doc["student_name"],
        usn=doc["usn"],
        branch=doc["branch"],
        semester=doc["semester"],
        status=doc["status"],
        sln=doc["sln"],
        submitted_at=doc["submitted_at"],
        reviewed_at=doc["reviewed_at"],
        rejection_reason=doc["rejection_reason"],
        date_of_birth=doc.get("date_of_birth"),
        blood_group=doc.get("blood_group"),
        phone=doc.get("phone"),
        parent_name=doc.get("parent_name"),
        mother_name=doc.get("mother_name"),
        aadhaar_number=doc.get("aadhaar_number"),
        contact_address=doc.get("contact_address"),
        email=doc.get("email"),
        photo_base64=doc.get("photo_base64"),
        signature_base64=doc.get("signature_base64")
    )


@router.get("/my", response_model=Optional[StudentSubmissionResponse])
async def get_my_submission(
    authorization: str = Header(...)
):
    """Get current student's submission (if exists)."""
    student = await get_current_student(authorization)
    
    collection = get_submissions_collection()
    doc = await collection.find_one({
        "$or": [
            {"email": student["email"]},
            {"firebase_uid": student["uid"]}
        ]
    })
    
    if not doc:
        return None
    
    return StudentSubmissionResponse(
        id=str(doc["_id"]),
        student_name=doc["student_name"],
        usn=doc["usn"],
        branch=doc["branch"],
        semester=doc["semester"],
        status=doc["status"],
        sln=doc.get("sln"),
        submitted_at=doc["submitted_at"],
        reviewed_at=doc.get("reviewed_at"),
        rejection_reason=doc.get("rejection_reason"),
        date_of_birth=doc.get("date_of_birth"),
        blood_group=doc.get("blood_group"),
        phone=doc.get("phone"),
        parent_name=doc.get("parent_name"),
        mother_name=doc.get("mother_name"),
        aadhaar_number=doc.get("aadhaar_number"),
        contact_address=doc.get("contact_address"),
        email=doc.get("email"),
        photo_base64=doc.get("photo_base64"),
        signature_base64=doc.get("signature_base64")
    )


@router.get("/", response_model=dict)
async def list_submissions(
    status: Optional[str] = Query(None, description="Filter by status"),
    branch: Optional[str] = Query(None, description="Filter by branch"),
    semester: Optional[int] = Query(None, description="Filter by semester"),
    search: Optional[str] = Query(None, description="Search by name or USN"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_admin_user)
):
    """List all submissions with filtering (Admin only)."""
    collection = get_submissions_collection()
    
    # Build query
    query = {}
    if status:
        query["status"] = status
    if branch:
        query["branch"] = branch
    if semester:
        query["semester"] = semester
    if search:
        query["$or"] = [
            {"student_name": {"$regex": search, "$options": "i"}},
            {"usn": {"$regex": search, "$options": "i"}}
        ]
    
    # Get total count
    total = await collection.count_documents(query)
    
    # Get paginated results
    skip = (page - 1) * per_page
    cursor = collection.find(query).sort("submitted_at", -1).skip(skip).limit(per_page)
    docs = await cursor.to_list(length=per_page)
    
    submissions = [
        {
            "id": str(doc["_id"]),
            "student_name": doc["student_name"],
            "usn": doc["usn"],
            "branch": doc["branch"],
            "semester": doc["semester"],
            "status": doc["status"],
            "sln": doc.get("sln"),
            "submitted_at": doc["submitted_at"],
            "reviewed_at": doc.get("reviewed_at"),
            "photo_base64": doc.get("photo_base64"),
            "signature_base64": doc.get("signature_base64"),
            "date_of_birth": doc.get("date_of_birth"),
            "blood_group": doc.get("blood_group"),
            "phone": doc.get("phone"),
            "parent_name": doc.get("parent_name"),
            "mother_name": doc.get("mother_name"),
            "contact_address": doc.get("contact_address"),
            "rejection_reason": doc.get("rejection_reason")
        }
        for doc in docs
    ]
    
    return {
        "submissions": submissions,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page
    }


@router.get("/{submission_id}")
async def get_submission(
    submission_id: str,
    current_user: User = Depends(get_current_admin_user)
):
    """Get a single submission by ID (Admin only)."""
    collection = get_submissions_collection()
    
    try:
        obj_id = ObjectId(submission_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid submission ID")
    
    doc = await collection.find_one({"_id": obj_id})
    
    if not doc:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.patch("/{submission_id}", response_model=StudentSubmissionResponse)
async def update_submission_status(
    submission_id: str,
    update_data: StudentSubmissionUpdate,
    current_user: User = Depends(get_current_admin_user)
):
    """Update submission details and status (Admin only)."""
    collection = get_submissions_collection()
    
    try:
        obj_id = ObjectId(submission_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid submission ID")
    
    doc = await collection.find_one({"_id": obj_id})
    
    if not doc:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # 1. Prepare Update Dictionary
    update_fields = update_data.model_dump(exclude_unset=True)
    
    # Handle logic if Status is changing
    if "status" in update_fields:
        update_fields["reviewed_at"] = datetime.utcnow()
        update_fields["reviewed_by"] = current_user.email
        
        # If approving, assign SLN if not present
        if update_fields["status"] == "approved" and not doc.get("sln"):
            max_sln = await collection.find_one(
                {"sln": {"$ne": None}},
                sort=[("sln", -1)]
            )
            update_fields["sln"] = (max_sln.get("sln", 0) if max_sln else 0) + 1

            # Blockchain Log (use new USN if updated, else old)
            target_usn = update_fields.get("usn", doc["usn"])
            hash_value = blockchain.log_action(
                usn=target_usn,
                event_id=0,
                action="approved",
                admin_email=current_user.email,
                event_name="Student Registration"
            )
            update_fields["blockchain_hash"] = hash_value
            
    # 2. Perform MongoDB Update
    if update_fields:
        await collection.update_one({"_id": obj_id}, {"$set": update_fields})
    
    # 3. Fetch Updated Document
    updated = await collection.find_one({"_id": obj_id})
    
    # 4. Sync to PostgreSQL if Status is Approved (or if just updating details for an already approved student)
    if updated["status"] == "approved":
        from app.db.postgres import get_postgres_session
        from app.models.sql_models import Student
        from sqlalchemy import select
        
        gen = get_postgres_session()
        pg_session = await anext(gen)
        
        try:
            # Check if student exists (by USN)
            result = await pg_session.execute(select(Student).where(Student.usn == updated["usn"]))
            existing_student = result.scalar_one_or_none()
            
            if existing_student:
                # Update existing
                existing_student.name = updated["student_name"]
                existing_student.email = updated.get("email")
                existing_student.branch = updated["branch"]
                existing_student.semester = updated["semester"]
                existing_student.phone = updated.get("phone")
                existing_student.dob = updated.get("date_of_birth")
                existing_student.blood_group = updated.get("blood_group")
                existing_student.parent_name = updated.get("parent_name")
                existing_student.mother_name = updated.get("mother_name")
                existing_student.address = updated.get("contact_address")
            else:
                # Create new
                new_student = Student(
                    usn=updated["usn"],
                    name=updated["student_name"],
                    email=updated.get("email"),
                    branch=updated["branch"],
                    semester=updated["semester"],
                    phone=updated.get("phone"),
                    dob=updated.get("date_of_birth"),
                    blood_group=updated.get("blood_group"),
                    parent_name=updated.get("parent_name"),
                    mother_name=updated.get("mother_name"),
                    address=updated.get("contact_address")
                )
                pg_session.add(new_student)
            
            await pg_session.commit()
            print(f"✅ Synced student {updated['usn']} to PostgreSQL.")
            
        except Exception as e:
            print(f"❌ Failed to sync to Postgres: {e}")
        finally:
            await pg_session.close()

    return StudentSubmissionResponse(
        id=str(updated["_id"]),
        student_name=updated["student_name"],
        usn=updated["usn"],
        branch=updated["branch"],
        semester=updated["semester"],
        status=updated["status"],
        sln=updated.get("sln"),
        submitted_at=updated["submitted_at"],
        reviewed_at=updated.get("reviewed_at"),
        rejection_reason=updated.get("rejection_reason"),
        date_of_birth=updated.get("date_of_birth"),
        blood_group=updated.get("blood_group"),
        phone=updated.get("phone"),
        parent_name=updated.get("parent_name"),
        mother_name=updated.get("mother_name"),
        contact_address=updated.get("contact_address"),
        email=updated.get("email"),
        photo_base64=updated.get("photo_base64"),
        signature_base64=updated.get("signature_base64")
    )


@router.delete("/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_submission(
    submission_id: str,
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a submission (Admin only)."""
    collection = get_submissions_collection()
    
    try:
        obj_id = ObjectId(submission_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid submission ID")
    
    result = await collection.delete_one({"_id": obj_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")


@router.get("/sports/list")
async def get_sports_list(
    current_user: User = Depends(get_current_admin_user)
):
    """Get list of unique sports/games from approved submissions."""
    collection = get_submissions_collection()
    
    pipeline = [
        {"$match": {"status": "approved"}},
        {"$group": {"_id": "$game_sport_competition"}},
        {"$sort": {"_id": 1}}
    ]
    
    cursor = collection.aggregate(pipeline)
    results = await cursor.to_list(length=100)
    
    return [r["_id"] for r in results if r["_id"]]
