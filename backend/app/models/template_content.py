import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import SECTION_TYPE_ENUM, SectionType
from app.models.mixins import UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.template import Template


class TemplateContent(UUIDPrimaryKeyMixin, Base):
    """Which sections a template ships with, and their defaults.

    Lets each template offer a different section set without adding a table per
    template — the editor reads these rows to seed a new wedding.
    """

    __tablename__ = "template_content"
    __table_args__ = (
        UniqueConstraint("template_id", "section_key", name="uq_template_content_section_key"),
    )

    template_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Stable machine key, e.g. "bride_info".
    section_key: Mapped[str] = mapped_column(String(100), nullable=False)
    # Label shown in the editor, e.g. "Сүйт бүсгүйн мэдээлэл".
    display_name: Mapped[str] = mapped_column(String(150), nullable=False)
    section_type: Mapped[SectionType] = mapped_column(SECTION_TYPE_ENUM, nullable=False)
    default_content: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default=text("'{}'::jsonb")
    )
    display_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    is_required: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false")
    )
    is_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )

    template: Mapped["Template"] = relationship(back_populates="contents")
