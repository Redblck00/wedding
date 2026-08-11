import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import AccessType, SectionType, UserTemplateStatus
from app.schemas.common import ORMModel


class TemplateCategoryRead(ORMModel):
    id: uuid.UUID
    name: str
    slug: str


class TemplateContentRead(ORMModel):
    id: uuid.UUID
    section_key: str
    display_name: str
    section_type: SectionType
    default_content: dict[str, Any]
    display_order: int
    is_required: bool
    is_enabled: bool


class TemplateRead(ORMModel):
    id: uuid.UUID
    name: str
    thumbnail_url: str
    preview_url: str | None
    price: Decimal
    is_free: bool
    is_active: bool
    created_at: datetime
    category: TemplateCategoryRead | None = None


class TemplateDetailRead(TemplateRead):
    """Marketplace detail view — includes the section list the editor will seed from."""

    contents: list[TemplateContentRead] = Field(default_factory=list)


class TemplateCreate(BaseModel):
    """Admin-only."""

    name: str = Field(min_length=1, max_length=150)
    category_id: uuid.UUID | None = None
    thumbnail_url: str
    preview_url: str | None = None
    price: Decimal = Decimal("0")
    is_free: bool = False
    is_active: bool = True


class TemplateUpdate(BaseModel):
    """Admin-only. Every field optional — this is a PATCH body."""

    name: str | None = Field(default=None, min_length=1, max_length=150)
    category_id: uuid.UUID | None = None
    thumbnail_url: str | None = None
    preview_url: str | None = None
    price: Decimal | None = None
    is_free: bool | None = None
    is_active: bool | None = None


class UserTemplateRead(ORMModel):
    id: uuid.UUID
    template: TemplateRead
    access_type: AccessType
    status: UserTemplateStatus
    acquired_at: datetime
