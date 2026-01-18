import asyncio
import sys
import os
from datetime import datetime

# Ensure backend dir is in path
sys.path.append(os.getcwd())

from app.db.mongodb import get_database, connect_to_mongo
from bson import ObjectId

async def seed_submission():
    print("Connecting to Mongo...")
    await connect_to_mongo()
    db = get_database()
    collection = db["student_submissions"]
    
    import random
    suffix = random.randint(1000, 9999)
    # Create dummy submission
    doc = {
        "student_name": f"Test Student {suffix}",
        "usn": f"1RV23CS{suffix}",
        "branch": "CSE",
        "semester": 5,
        "date_of_birth": "2000-01-01",
        "contact_address": "Test Address",
        "blood_group": "B+",
        "phone": "9999999999",
        "parent_name": "Test Parent",
        "mother_name": "Test Mother",
        "email": "student@rvce.edu.in",
        "firebase_uid": "test_uid_123",
        "status": "pending",
        "submitted_at": datetime.utcnow()
    }
    
    result = await collection.insert_one(doc)
    print(f"✅ Created dummy submission with ID: {result.inserted_id}")
    return str(result.inserted_id)

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed_submission())
