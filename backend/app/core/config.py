from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # MongoDB (Student submissions, participation requests)
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "rvce_sports"
    
    # PostgreSQL (Users, Events, Approved Participants)
    DATABASE_URL: str = "postgresql+asyncpg://localhost:5432/rvce_sports"
    
    # JWT (Admin Auth)
    SECRET_KEY: str = "your-super-secret-key-change-this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    
    # Firebase (Student Auth)
    FIREBASE_API_KEY: Optional[str] = None
    FIREBASE_AUTH_DOMAIN: Optional[str] = None
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_STORAGE_BUCKET: Optional[str] = None
    FIREBASE_MESSAGING_SENDER_ID: Optional[str] = None
    FIREBASE_APP_ID: Optional[str] = None
    
    # Hardcoded Admin (as per spec)
    ADMIN_EMAIL: str = "khan2228zeenat@gmail.com"
    ADMIN_PASSWORD: str = "1234567890"

    # Email Service
    EMAIL_PROVIDER: str = "smtp"  # smtp, sendgrid
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "no-reply@rvce.edu.in"
    MAX_EMAILS_PER_BATCH: int = 100

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra env vars


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
