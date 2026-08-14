import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.common import ORMModel


class RsvpCreate(BaseModel):
    """Submitted by guests through the *public* endpoint — no auth. Keep the
    bounds tight; this is the one body anyone on the internet can POST.
    """

    # Stripping happens before the length checks below, so a name of nothing but
    # spaces fails min_length instead of being stored as blank. It also lets the
    # router's duplicate check match "Bat " against "Bat".
    model_config = ConfigDict(str_strip_whitespace=True)

    guest_name: str = Field(min_length=1, max_length=150)
    guest_contact: str | None = Field(default=None, max_length=150)
    attending: bool
    number_of_guests: int = Field(default=1, ge=0, le=50)
    message: str | None = Field(default=None, max_length=2000)

    @field_validator("guest_contact", "message")
    @classmethod
    def _blank_to_none(cls, value: str | None) -> str | None:
        """"" and None both mean "not given" — store one of them, not both.

        A form that posts empty inputs as "" would otherwise be a different reply
        from one that omits them, and the duplicate check would miss the match.
        """
        return value or None


class RsvpRead(ORMModel):
    id: uuid.UUID
    guest_name: str
    guest_contact: str | None
    attending: bool
    number_of_guests: int
    message: str | None
    responded_at: datetime


class RsvpStats(BaseModel):
    total_responses: int
    attending_count: int
    declined_count: int
    total_guests: int  # sum of `number_of_guests` across attending replies


class RsvpListResponse(BaseModel):
    stats: RsvpStats
    items: list[RsvpRead]
