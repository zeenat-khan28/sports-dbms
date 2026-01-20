"""MongoDB async connection using Motor."""
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

# Global database variables
_client: AsyncIOMotorClient = None
_db = None


async def connect_to_mongo():
    """Connect to MongoDB Atlas."""
    global _client, _db
    
    try:
        # Create client with timeout settings for Atlas
        _client = AsyncIOMotorClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=5000,  # 5 second timeout
            connectTimeoutMS=10000,
            socketTimeoutMS=10000
        )
        _db = _client[settings.MONGO_DB_NAME]
        
        # Verify connection by pinging the server
        await _client.admin.command('ping')
        print(f"✅ MongoDB Connected Successfully!")
        print(f"   Database: {settings.MONGO_DB_NAME}")
        
        # -----------------------------------------------------
        # Ensure Indexes
        # -----------------------------------------------------
        # Enforce unique USN at database level
        await _db["student_submissions"].create_index("usn", unique=True)
        
    except Exception as e:
        print(f"❌ MongoDB Connection Failed: {e}")
        print(f"   URI: {settings.MONGO_URI[:30]}...")  # Show first 30 chars only
        raise


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
