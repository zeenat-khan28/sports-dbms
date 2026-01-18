"""Security utilities for authentication and password hashing."""
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from app.core.config import settings
from app.db.postgres import get_postgres_session
from app.models.sql_models import User

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for admin JWT
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Initialize Firebase Admin SDK (if credentials exist)
firebase_initialized = False
try:
    # Check if already initialized
    firebase_admin.get_app()
    firebase_initialized = True
except ValueError:
    # Not initialized, skip for now (will use manual verification)
    firebase_initialized = False
    print("⚠️ Firebase Admin SDK not initialized (no service account). Using client-side verification only.")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def get_current_admin_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_postgres_session)
) -> User:
    """
    Dependency to get current authenticated admin user.
    Raises HTTPException if not authenticated.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    return user


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token and return the decoded claims.
    
    For production, you need a Firebase service account.
    For development, we'll do client-side only verification.
    """
    if firebase_initialized:
        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
            return decoded_token
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Firebase token: {str(e)}"
            )
    else:
        # For development without service account, decode JWT without verification
        # WARNING: This is NOT secure for production!
        try:
            # Decode without verification (development only)
            import base64
            import json
            parts = id_token.split('.')
            if len(parts) != 3:
                raise HTTPException(status_code=401, detail="Invalid token format")
            
            # Add padding if needed
            payload = parts[1]
            payload += '=' * (4 - len(payload) % 4)
            decoded = json.loads(base64.urlsafe_b64decode(payload))
            return decoded
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token decode error: {str(e)}"
            )


def check_rvce_domain(email: str) -> bool:
    """Check if email is from @rvce.edu.in domain."""
    return email.endswith("@rvce.edu.in")


async def get_current_student(
    authorization: str = None
) -> dict:
    """
    Dependency to get current authenticated student from Firebase token.
    Enforces @rvce.edu.in domain restriction.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    decoded = verify_firebase_token(token)
    
    email = decoded.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email not found in token"
        )
    
    if not check_rvce_domain(email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only @rvce.edu.in emails are allowed"
        )
    
    return {
        "uid": decoded.get("user_id") or decoded.get("sub"),
        "email": email,
        "name": decoded.get("name"),
        "picture": decoded.get("picture")
    }
