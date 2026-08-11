import uuid

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class VenueCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    address: str | None = None
    map_url: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    display_order: int = 0


class VenueUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    address: str | None = None
    map_url: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    display_order: int | None = None


class VenueRead(ORMModel):
    id: uuid.UUID
    name: str
    address: str | None
    map_url: str | None
    latitude: float | None
    longitude: float | None
    display_order: int
