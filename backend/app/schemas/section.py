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

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import SectionType
from app.schemas.common import ORMModel


class SectionContent(BaseModel):
    model_config = ConfigDict(extra="allow")


class BrideInfoContent(SectionContent):
    name: str | None = None
    photo_url: str | None = None
    bio: str | None = None
    parents: str | None = None
    # Printed in the invitation's footer so a guest can ring about the day.
    # `users.phone` is the account holder's and is never shown to guests.
    phone: str | None = None


class GroomInfoContent(SectionContent):
    name: str | None = None
    photo_url: str | None = None
    bio: str | None = None
    parents: str | None = None
    phone: str | None = None


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

    # The photograph a design's closing panel opens on, and the line printed
    # over it. Both optional: a template without such a panel ignores them, and
    # one that has it falls back to the last gallery photo.
    #
    # Declared here rather than left to `extra="allow"` — an undeclared key is
    # stored happily but never checked, so a typo would save cleanly and simply
    # show nothing, with no error anywhere to explain why.
    final_media_id: uuid.UUID | None = None
    final_subtitle: str | None = None

    # The photograph a design puts behind its opening screen. Same reasoning as
    # the pair above: optional, declared rather than left to `extra="allow"`, and
    # a template that has no such backdrop ignores it. One that does falls back
    # to the first gallery photo.
    hero_media_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def _chosen_photos_must_be_in_the_gallery(self) -> "GalleryContent":
        """Stops a chosen photo pointing at one the gallery does not hold.

        `media_ids` is the display list, so an id outside it is either a typo or
        a photo the couple already removed — both render as a silently missing
        picture. Deleting the file later is handled separately, in
        `routers/media.py`.
        """
        for field in ("final_media_id", "hero_media_id"):
            value = getattr(self, field)
            if value is not None and value not in self.media_ids:
                raise ValueError(f"{field} must be one of media_ids")

        return self


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

    # Where the track should come in, in seconds — the chorus rather than a long
    # intro nobody hears the end of. Filled either from a timestamp on the
    # pasted link or from the field beside it; see `_normalise_music`.
    #
    # The ceiling is a day, matching `youtube.MAX_START_SECONDS`. It exists to
    # bound the value, not to be a real limit: a start past the end of the video
    # is YouTube's business, and it simply begins at zero.
    start_seconds: int | None = Field(default=None, ge=0, le=86_400)

    # Best-effort, and only a design that opens on a tap can act on it: browsers
    # refuse sound until the page has a user activation. A template whose first
    # screen is not interactive must ignore this rather than render a control
    # that lies. The play/pause toggle stays either way — a guest has to be able
    # to stop it.
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
