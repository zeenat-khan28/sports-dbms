"""Authentication API endpoints."""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.postgres import get_postgres_session
from app.models.sql_models import User
from app.schemas.schemas import UserCreate, UserLogin, Token, UserResponse
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    get_current_admin_user
)
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_postgres_session)
):
    """
    Login endpoint.
    Strictly enforcing the hardcoded admin credentials.
    """
    print(f"DEBUG LOGIN ATTEMPT: username='{form_data.username}', password='{form_data.password}'")
    print(f"EXPECTED: email='{settings.ADMIN_EMAIL}', password='{settings.ADMIN_PASSWORD}'")

    # 1. Check against hardcoded credentials (strip whitespace)
    input_email = form_data.username.strip()
    input_password = form_data.password.strip()
    
    if (input_email == settings.ADMIN_EMAIL and 
        input_password == settings.ADMIN_PASSWORD):
        print("DEBUG: Credentials match! Proceeding to DB check.")
        
        # Ensure user exists in DB and has correct role/hash
        result = await db.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
        admin_user = result.scalar_one_or_none()
        
        current_hash = get_password_hash(settings.ADMIN_PASSWORD)
        
        if not admin_user:
            # Create if doesn't exist
            admin_user = User(
                email=settings.ADMIN_EMAIL,
                password_hash=current_hash,
                role="admin"
            )
            db.add(admin_user)
            await db.commit()
        else:
            # Update password hash if needed (self-healing)
            # This fixes issues if the DB has an old password
            admin_user.password_hash = current_hash
            request_update = False
            if admin_user.role != "admin":
                admin_user.role = "admin"
                request_update = True
            
            # verify_password check is expensive, so just overwrite hash directly
            # or check if we want to be optimal. For now, just commit.
            db.add(admin_user)
            await db.commit()

        # Create token
        access_token = create_access_token(
            data={"sub": settings.ADMIN_EMAIL, "role": "admin"}
        )
        return Token(access_token=access_token)
    
    # 2. Reject everything else
    # We are disabling generic DB login for now to enforce the single admin policy
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user: User = Depends(get_current_admin_user)
):
    """Get current authenticated admin user info."""
    return current_user
