"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ── Auth ──────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── User ──────────────────────────────────────────────────────────────────

class UserMe(BaseModel):
    id: int
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_admin: bool
    requests_used: int
    max_requests: int
    is_active: bool

    model_config = {"from_attributes": True}


# ── Ask ───────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000)


class AskResponse(BaseModel):
    response: str
    input_tokens: int
    output_tokens: int
    requests_remaining: int


# ── Admin ─────────────────────────────────────────────────────────────────

class AdminUserView(BaseModel):
    id: int
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_admin: bool
    requests_used: int
    max_requests: int
    is_active: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AdminLogView(BaseModel):
    id: int
    user_id: int
    username: str
    prompt: str
    response: str
    input_tokens: int
    output_tokens: int
    created_at: Optional[datetime] = None


class ToggleUserRequest(BaseModel):
    is_active: bool


class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: str = Field(..., min_length=1)
    max_requests: int = 100


class UpdateUserRequestsRequest(BaseModel):
    max_requests: int = Field(..., gt=0)
