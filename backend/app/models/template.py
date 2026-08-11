import uuid
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import CreatedAtMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.template_category import TemplateCategory
    from app.models.template_content import TemplateContent
    from app.models.user_template import UserTemplate
    from app.models.wedding import Wedding


class Template(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    """A purchasable invitation design.

    The category *name* is read through `category_id` — there is deliberately no
    `category` string column here, so the name has one source of truth.
    """

    __tablename__ = "templates"

    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("template_categories.id", ondelete="SET NULL"),
        index=True,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    thumbnail_url: Mapped[str] = mapped_column(Text, nullable=False)
    preview_url: Mapped[str | None] = mapped_column(Text)
    price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0"), server_default=text("0")
    )
    is_free: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false"), index=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )

    category: Mapped[Optional["TemplateCategory"]] = relationship(back_populates="templates")
    contents: Mapped[list["TemplateContent"]] = relationship(
        back_populates="template", cascade="all, delete-orphan"
    )
    user_templates: Mapped[list["UserTemplate"]] = relationship(
        back_populates="template", cascade="all, delete-orphan"
    )
    weddings: Mapped[list["Wedding"]] = relationship(back_populates="template")
