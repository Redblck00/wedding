import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import SECTION_TYPE_ENUM, SectionType
from app.models.mixins import UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.media_asset import MediaAsset
    from app.models.wedding import Wedding


class WeddingSection(UUIDPrimaryKeyMixin, Base):
    """One editable block of an invitation.

    Section-specific fields (bride bio, story text, schedule entries, gift bank
    details, dress code…) live inside `content` — never as flat columns here, so
    adding a field to one section type does not migrate the whole table.
    """

    __tablename__ = "wedding_sections"
    __table_args__ = (
        # One section per type per wedding — two galleries on one invitation
        # would need this constraint relaxed and a `section_key` added.
        UniqueConstraint("wedding_id", "section_type", name="uq_wedding_sections_type"),
        Index("idx_wedding_sections_content_gin", "content", postgresql_using="gin"),
    )

    wedding_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("weddings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    section_type: Mapped[SectionType] = mapped_column(SECTION_TYPE_ENUM, nullable=False)
    content: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default=text("'{}'::jsonb")
    )
    display_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    is_visible: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    wedding: Mapped["Wedding"] = relationship(back_populates="sections")
    media_assets: Mapped[list["MediaAsset"]] = relationship(back_populates="section")
