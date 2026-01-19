
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def remove_all_duplicates():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]
    collection = db["student_submissions"]

    print("Aggregating to find duplicates...")
    pipeline = [
        {"$group": {
            "_id": "$usn",
            "count": {"$sum": 1},
            "docs": {"$push": {"_id": "$_id", "submitted_at": "$submitted_at"}}
        }},
        {"$match": {
            "count": {"$gt": 1}
        }}
    ]

    cursor = collection.aggregate(pipeline)
    async for result in cursor:
        usn = result["_id"]
        count = result["count"]
        print(f"Found {count} entries for USN: {usn}")

        # Sort docs by submitted_at descending (newest first)
        # If submitted_at is missing, it might sort somewhat arbitrarily, but we'll try
        docs = sorted(result["docs"], key=lambda x: x.get("submitted_at") or "", reverse=True)
        
        # Keep the first one, delete the rest
        to_keep = docs[0]
        to_delete = docs[1:]

        print(f"  Keeping document ID: {to_keep['_id']}")
        
        for doc in to_delete:
            print(f"  Deleting duplicate ID: {doc['_id']}")
            await collection.delete_one({"_id": doc["_id"]})
            
    print("Duplicate cleanup complete.")
    client.close()

if __name__ == "__main__":
    asyncio.run(remove_all_duplicates())
