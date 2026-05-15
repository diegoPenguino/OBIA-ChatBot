"""Admin endpoints for monitoring users and logs."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.dependencies import require_admin
from app.models import User, RequestLog
from app.schemas import (
    AdminUserView, 
    AdminLogView, 
    ToggleUserRequest, 
    CreateUserRequest, 
    UpdateUserRequestsRequest
)
from app.auth import hash_password

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserView])
def list_users(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all users with their usage stats."""
    users = db.query(User).order_by(User.id).all()
    return users


@router.get("/logs", response_model=list[AdminLogView])
def list_logs(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
    user_id: int | None = None,
):
    """List interaction logs, optionally filtered by user."""
    query = db.query(RequestLog).join(User)

    if user_id is not None:
        query = query.filter(RequestLog.user_id == user_id)

    logs = (
        query.order_by(desc(RequestLog.created_at))
        .offset(offset)
        .limit(min(limit, 500))
        .all()
    )

    return [
        AdminLogView(
            id=log.id,
            user_id=log.user_id,
            username=log.user.username,
            prompt=log.prompt,
            response=log.response,
            input_tokens=log.input_tokens,
            output_tokens=log.output_tokens,
            created_at=log.created_at,
        )
        for log in logs
    ]


@router.patch("/users/{user_id}", response_model=AdminUserView)
def toggle_user(
    user_id: int,
    body: ToggleUserRequest,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Enable or disable a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.is_active = body.is_active
    db.commit()
    db.refresh(user)
    return user


@router.post("/users", response_model=AdminUserView)
def create_user(
    body: CreateUserRequest,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Manually create a new student user."""
    # Check if username exists
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    new_user = User(
        username=body.username,
        first_name=body.first_name,
        last_name=body.last_name,
        password_hash=hash_password(body.password),
        is_admin=False,
        max_requests=body.max_requests,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.patch("/users/{user_id}/requests", response_model=AdminUserView)
def update_user_requests(
    user_id: int,
    body: UpdateUserRequestsRequest,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update the maximum requests for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.max_requests = body.max_requests
    db.commit()
    db.refresh(user)
    return user
