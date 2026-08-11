import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import WEDDING_STATUS_ENUM, WeddingStatus
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.media_asset import MediaAsset
    from app.models.rsvp import RsvpResponse
    from app.models.template import Template
    from app.models.user import User
    from app.models.venue import Venue
    from app.models.wedding_section import WeddingSection


class Wedding(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "weddings"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # No ON DELETE: a template in use by a live invitation must not be deletable.
    template_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("templates.id"), nullable=False
    )
    # `unique=True` already builds the index the public `/wedding/{slug}` lookup
    # needs — schema.sql's separate `idx_weddings_slug` was redundant.
    slug: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    bride_name: Mapped[str | None] = mapped_column(String(150))
    groom_name: Mapped[str | None] = mapped_column(String(150))
    wedding_date: Mapped[Optional[date]] = mapped_column(Date)
    theme_color: Mapped[str | None] = mapped_column(String(20))
    font_family: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[WeddingStatus] = mapped_column(
        WEDDING_STATUS_ENUM, nullable=False, default=WeddingStatus.DRAFT, index=True
    )
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship(back_populates="weddings")
    template: Mapped["Template"] = relationship(back_populates="weddings")
    sections: Mapped[list["WeddingSection"]] = relationship(
        back_populates="wedding", cascade="all, delete-orphan"
    )
    venues: Mapped[list["Venue"]] = relationship(
        back_populates="wedding", cascade="all, delete-orphan"
    )
    media_assets: Mapped[list["MediaAsset"]] = relationship(
        back_populates="wedding", cascade="all, delete-orphan"
    )
    rsvp_responses: Mapped[list["RsvpResponse"]] = relationship(
        back_populates="wedding", cascade="all, delete-orphan"
    )
