import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, Text, func, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import MEDIA_TYPE_ENUM, MediaType
from app.models.mixins import UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.wedding import Wedding
    from app.models.wedding_section import WeddingSection


class MediaAsset(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "media_assets"

    wedding_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("weddings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # SET NULL, not CASCADE: deleting a section should not delete the couple's
    # uploaded photos — they stay attached to the wedding and can be re-placed.
    section_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("wedding_sections.id", ondelete="SET NULL"),
        index=True,
    )
    type: Mapped[MediaType] = mapped_column(MEDIA_TYPE_ENUM, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(Text)
    # Cloudinary's own identifier. Not in the original schema, but without it the
    # destroy API cannot be called — deleting a row would leave the file (and its
    # storage cost) behind forever. See `app/utils/storage_client.py`.
    cloudinary_public_id: Mapped[str | None] = mapped_column(String(255))
    file_size_bytes: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=text("0")
    )
    width: Mapped[Optional[int]] = mapped_column(Integer)
    height: Mapped[Optional[int]] = mapped_column(Integer)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    wedding: Mapped["Wedding"] = relationship(back_populates="media_assets")
    section: Mapped[Optional["WeddingSection"]] = relationship(back_populates="media_assets")
