import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import UserRole
from app.schemas.common import ORMModel


class UserRead(ORMModel):
    """Note the absence of `password_hash` — never widen this to include it."""

    id: uuid.UUID
    full_name: str
    email: EmailStr
    phone: str
    role: UserRole
    avatar_url: str | None
    created_at: datetime


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, min_length=6, max_length=20)
    avatar_url: str | None = None
