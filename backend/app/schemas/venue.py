import uuid
from datetime import time

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class VenueCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    address: str | None = None
    map_url: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    starts_at: time | None = None
    photo_media_id: uuid.UUID | None = None
    display_order: int = 0


class VenueUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    address: str | None = None
    map_url: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    starts_at: time | None = None
    photo_media_id: uuid.UUID | None = None
    display_order: int | None = None


class VenueRead(ORMModel):
    id: uuid.UUID
    name: str
    address: str | None
    map_url: str | None
    latitude: float | None
    longitude: float | None
    starts_at: time | None
    # The guest page resolves this against the `media_assets` list it already
    # receives — the same lookup a gallery's `media_ids` needs.
    photo_media_id: uuid.UUID | None
    display_order: int
