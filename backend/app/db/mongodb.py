"""MongoDB async connection using Motor."""
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

# Global database variables
_client: AsyncIOMotorClient = None
_db = None


async def connect_to_mongo():
    """Connect to MongoDB."""
    global _client, _db
    _client = AsyncIOMotorClient(settings.MONGO_URI)
    _db = _client[settings.MONGO_DB_NAME]
    
    # Verify connection
    await _client.admin.command('ping')
    
    # -----------------------------------------------------
    # Ensure Indexes
    # -----------------------------------------------------
    # Enforce unique USN at database level
    await _db["student_submissions"].create_index("usn", unique=True)
    
    print(f"✅ Connected to MongoDB: {settings.MONGO_DB_NAME}")


async def close_mongo_connection():
    """Close MongoDB connection."""
    global _client
    if _client:
        _client.close()
        print("🔌 MongoDB connection closed")


def get_database():
    """Get the MongoDB database instance."""
    global _db
    if _db is None:
        raise RuntimeError("MongoDB not connected. Call connect_to_mongo first.")
    return _db


def get_submissions_collection():
    """Get student submissions collection."""
    return get_database()["student_submissions"]


def get_participation_collection():
    """Get event participation requests collection."""
    return get_database()["event_participation_requests"]


def get_audit_logs_collection():
    """Get audit logs collection."""
    return get_database()["audit_logs"]
