"""FastAPI dependency injection helpers."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import decode_access_token
from app.models import User

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Extract and validate the current user from the JWT bearer token."""
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        print("DEBUG: Payload is None")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id_str = payload.get("sub")
    print(f"DEBUG: Payload sub: {user_id_str}")
    
    if user_id_str is None:
        print("DEBUG: User ID (sub) is missing from payload")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        print(f"DEBUG: User ID is not an integer: {user_id_str}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        print(f"DEBUG: User with ID {user_id} not found in DB")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        print(f"DEBUG: User {user.username} is inactive")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Ensure the current user has admin privileges."""
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user
