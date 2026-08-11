import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import WeddingStatus
from app.schemas.common import ORMModel
from app.schemas.media import MediaAssetRead
from app.schemas.section import WeddingSectionRead
from app.schemas.template import TemplateRead
from app.schemas.venue import VenueRead


# Lowercase Latin letters and digits, single hyphens between them — no leading,
# trailing or doubled hyphens. Capped at 60 rather than the column's 150: the
# slug is printed on the card and encoded in the QR, and both get worse as it
# grows.
SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
SLUG_MIN_LENGTH = 3
SLUG_MAX_LENGTH = 60

_SLUG_FIELD_DESCRIPTION = (
    "Public URL, e.g. 'bold-ba-sarnai'. Lowercase Latin letters, digits and hyphens only."
)


class WeddingCreate(BaseModel):
    template_id: uuid.UUID
    # Chosen by the couple, not derived: they see this URL before it is printed,
    # so a taken slug comes back as a 409 rather than being silently altered.
    slug: str = Field(
        min_length=SLUG_MIN_LENGTH,
        max_length=SLUG_MAX_LENGTH,
        pattern=SLUG_PATTERN,
        description=_SLUG_FIELD_DESCRIPTION,
        examples=["bold-ba-sarnai"],
    )
    bride_name: str | None = Field(default=None, max_length=150)
    groom_name: str | None = Field(default=None, max_length=150)
    wedding_date: date | None = None
    theme_color: str | None = Field(default=None, max_length=20)
    font_family: str | None = Field(default=None, max_length=100)


class WeddingUpdate(BaseModel):
    """PATCH body — `status` is deliberately absent; publishing goes through
    `POST /weddings/{id}/publish` so its rules cannot be bypassed.
    """

    bride_name: str | None = Field(default=None, max_length=150)
    groom_name: str | None = Field(default=None, max_length=150)
    wedding_date: date | None = None
    # ⚠ Changing this breaks every link and QR already handed out.
    slug: str | None = Field(
        default=None,
        min_length=SLUG_MIN_LENGTH,
        max_length=SLUG_MAX_LENGTH,
        pattern=SLUG_PATTERN,
        description=_SLUG_FIELD_DESCRIPTION,
    )
    theme_color: str | None = Field(default=None, max_length=20)
    font_family: str | None = Field(default=None, max_length=100)


class WeddingRead(ORMModel):
    id: uuid.UUID
    user_id: uuid.UUID
    template_id: uuid.UUID
    slug: str
    bride_name: str | None
    groom_name: str | None
    wedding_date: date | None
    theme_color: str | None
    font_family: str | None
    status: WeddingStatus
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime


class WeddingDetailRead(WeddingRead):
    """Owner's editor view."""

    template: TemplateRead
    sections: list[WeddingSectionRead] = Field(default_factory=list)
    venues: list[VenueRead] = Field(default_factory=list)
    media_assets: list[MediaAssetRead] = Field(default_factory=list)


class PublicWeddingRead(ORMModel):
    """What `GET /wedding/{slug}` returns to guests.

    Narrower than `WeddingDetailRead` on purpose: no `user_id`, no draft status,
    no internal template pricing — this response is world-readable.
    """

    slug: str
    bride_name: str | None
    groom_name: str | None
    wedding_date: date | None
    theme_color: str | None
    font_family: str | None
    template_id: uuid.UUID
    sections: list[WeddingSectionRead] = Field(default_factory=list)
    venues: list[VenueRead] = Field(default_factory=list)
    media_assets: list[MediaAssetRead] = Field(default_factory=list)
