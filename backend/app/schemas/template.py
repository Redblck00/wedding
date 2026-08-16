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


# Lowercase Latin letters and digits with single hyphens between them — the same
# shape as a wedding slug, because this string also lands in a URL
# (/templates/{code}) as well as in the frontend's component registry.
TEMPLATE_CODE_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


class TemplateRead(ORMModel):
    id: uuid.UUID
    code: str
    name: str
    thumbnail_url: str
    preview_url: str | None
    price: Decimal
    is_free: bool
    is_active: bool
    created_at: datetime
    category: TemplateCategoryRead | None = None


class TemplateDetailRead(TemplateRead):
    """Template plus its section definitions.

    Served by the marketplace detail view *and* embedded in the owner's
    `WeddingDetailRead` — the editor draws its forms from `contents`, so it must
    not have to ask the marketplace for them.
    """

    contents: list[TemplateContentRead] = Field(default_factory=list)


class TemplateCreate(BaseModel):
    """Admin-only."""

    code: str = Field(
        min_length=3,
        max_length=60,
        pattern=TEMPLATE_CODE_PATTERN,
        description="Registry key of the design's React component, e.g. 'rose-envelope'.",
        examples=["rose-envelope"],
    )
    name: str = Field(min_length=1, max_length=150)
    category_id: uuid.UUID | None = None
    thumbnail_url: str
    preview_url: str | None = None
    price: Decimal = Decimal("0")
    is_free: bool = False
    is_active: bool = True


class TemplateUpdate(BaseModel):
    """Admin-only. Every field optional — this is a PATCH body.

    `code` is deliberately absent. It names a component that ships with the
    frontend, so editing it from an admin form would point live invitations at a
    design that does not exist in the deployed bundle. Renaming one means
    shipping the new component first, then a migration — not a PATCH.
    """

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
