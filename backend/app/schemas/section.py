"""Per-`section_type` shapes for the JSONB `wedding_sections.content` column.

The column is schemaless in Postgres on purpose, so this module is the only
place that says what a valid section body looks like. `SECTION_CONTENT_SCHEMAS`
maps each type to its model; `app/services/section_service.py` looks the schema
up on autosave and rejects malformed bodies before they reach the database.

All content models use `extra="allow"`: an unknown key from a newer frontend is
preserved on round-trip rather than silently dropped.
"""

import datetime as dt
import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import SectionType
from app.schemas.common import ORMModel


class SectionContent(BaseModel):
    model_config = ConfigDict(extra="allow")


class BrideInfoContent(SectionContent):
    name: str | None = None
    photo_url: str | None = None
    bio: str | None = None
    parents: str | None = None


class GroomInfoContent(SectionContent):
    name: str | None = None
    photo_url: str | None = None
    bio: str | None = None
    parents: str | None = None


class StoryEntry(SectionContent):
    title: str | None = None
    # Qualified as `dt.date`, not a bare `date`: the field name would otherwise
    # shadow the imported type and the annotation would evaluate to `None | None`.
    date: dt.date | None = None
    text: str | None = None
    photo_url: str | None = None


class WeddingStoryContent(SectionContent):
    intro: str | None = None
    entries: list[StoryEntry] = Field(default_factory=list)


class ScheduleEntry(SectionContent):
    title: str
    starts_at: dt.time | None = None
    ends_at: dt.time | None = None
    description: str | None = None


class EventScheduleContent(SectionContent):
    entries: list[ScheduleEntry] = Field(default_factory=list)


class VenueSectionContent(SectionContent):
    """Copy only — the addresses and coordinates live in the `venues` table."""

    heading: str | None = None
    note: str | None = None


class GalleryContent(SectionContent):
    """`media_ids` is the source of truth for *which* photos show and in *what
    order*. `media_assets.section_id` only records where a file was uploaded —
    it is context, never the display list. If the two disagree, this wins.
    """

    media_ids: list[uuid.UUID] = Field(default_factory=list)
    layout: str | None = None  # "grid" | "carousel" | "masonry"


class RsvpFormContent(SectionContent):
    heading: str | None = None
    deadline: dt.date | None = None
    ask_guest_count: bool = True
    custom_question: str | None = None


class BackgroundMusicContent(SectionContent):
    """YouTube only — no audio file uploads.

    Accepts a pasted URL in any format and stores the bare id; see
    `app/services/section_service.py`.
    """

    youtube_video_id: str | None = None
    # Advisory only. Browsers block autoplay with sound, so the frontend still
    # has to render a "play" button — this flag cannot bypass that.
    autoplay: bool = False
    loop: bool = True


class BankAccount(SectionContent):
    bank_name: str | None = None
    account_number: str | None = None
    account_holder: str | None = None


class GiftInfoContent(SectionContent):
    message: str | None = None
    accounts: list[BankAccount] = Field(default_factory=list)


class DressCodeContent(SectionContent):
    description: str | None = None
    colors: list[str] = Field(default_factory=list)
    reference_image_url: str | None = None


SECTION_CONTENT_SCHEMAS: dict[SectionType, type[SectionContent]] = {
    SectionType.BRIDE_INFO: BrideInfoContent,
    SectionType.GROOM_INFO: GroomInfoContent,
    SectionType.WEDDING_STORY: WeddingStoryContent,
    SectionType.EVENT_SCHEDULE: EventScheduleContent,
    SectionType.VENUE: VenueSectionContent,
    SectionType.GALLERY: GalleryContent,
    SectionType.RSVP_FORM: RsvpFormContent,
    SectionType.BACKGROUND_MUSIC: BackgroundMusicContent,
    SectionType.GIFT_INFO: GiftInfoContent,
    SectionType.DRESS_CODE: DressCodeContent,
}


# --- Request / response wrappers ---------------------------------------------


class WeddingSectionRead(ORMModel):
    id: uuid.UUID
    section_type: SectionType
    content: dict[str, Any]
    display_order: int
    is_visible: bool
    updated_at: dt.datetime


class WeddingSectionUpsert(BaseModel):
    """Body of the editor's autosave PUT."""

    content: dict[str, Any]
    display_order: int | None = None
    is_visible: bool | None = None


class SectionReorderItem(BaseModel):
    section_type: SectionType
    display_order: int


class SectionReorderRequest(BaseModel):
    items: list[SectionReorderItem]
