from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    """Schema for creating a new admin user."""
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token payload data."""
    email: Optional[str] = None
    role: Optional[str] = None


class UserResponse(BaseModel):
    """Schema for user response (without password)."""
    id: int
    email: str
    full_name: Optional[str]
    role: str

    class Config:
        from_attributes = True
