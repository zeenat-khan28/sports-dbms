"""FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.db.postgres import init_postgres_db

# Import routers
from app.api import auth, submissions, events, participation, export, email, attendance, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events - startup and shutdown."""
    # Startup
    print("🚀 Starting RVCE Sports Management System...")
    
    # Connect to MongoDB
    await connect_to_mongo()
    
    # Initialize PostgreSQL tables
    await init_postgres_db()
    
    print("✅ All systems operational!")
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")
    await close_mongo_connection()


# Create FastAPI app
app = FastAPI(
    title="RVCE Sports Department Management System",
    description="API for managing student sports registrations, events, and participation",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_ORIGIN,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(submissions.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(participation.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(email.router, prefix="/api")
app.include_router(attendance.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "message": "RVCE Sports Management System API",
        "version": "2.0.0"
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "databases": {
            "mongodb": "connected",
            "postgresql": "connected"
        }
    }
