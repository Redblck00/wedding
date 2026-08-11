import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Float, ForeignKey, Integer, String, Text, text
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
    display_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )

    wedding: Mapped["Wedding"] = relationship(back_populates="venues")
