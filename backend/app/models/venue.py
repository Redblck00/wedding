import uuid
from datetime import time
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Float, ForeignKey, Integer, String, Text, Time, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.wedding import Wedding


class Venue(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A physical location for a wedding — e.g. ceremony vs. reception.

    Kept in its own table rather than inside a section's JSONB so coordinates
    have one source of truth and can be queried/mapped directly.
    """

    __tablename__ = "venues"

    wedding_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("weddings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)  # e.g. "Хуримын ордон"
    address: Mapped[str | None] = mapped_column(Text)
    map_url: Mapped[str | None] = mapped_column(Text)  # Google Maps share link
    latitude: Mapped[Optional[float]] = mapped_column(Float)
    longitude: Mapped[Optional[float]] = mapped_column(Float)
    # Clock time only — the calendar day is `weddings.wedding_date`.
    starts_at: Mapped[Optional[time]] = mapped_column(Time)
    # The card photo, as a tracked asset rather than a URL string: only a
    # media_assets row carries the cloudinary_public_id that makes the file
    # deletable later. SET NULL so removing a photo never removes the venue.
    photo_media_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("media_assets.id", ondelete="SET NULL"),
    )
    display_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )

    wedding: Mapped["Wedding"] = relationship(back_populates="venues")
