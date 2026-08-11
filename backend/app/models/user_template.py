import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import (
    ACCESS_TYPE_ENUM,
    USER_TEMPLATE_STATUS_ENUM,
    AccessType,
    UserTemplateStatus,
)
from app.models.mixins import CreatedAtMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.payment import Payment
    from app.models.template import Template
    from app.models.user import User


class UserTemplate(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    """Grants one user access to one template (free, purchased, or plan-included)."""

    __tablename__ = "user_templates"
    __table_args__ = (
        UniqueConstraint("user_id", "template_id", name="uq_user_templates_user_template"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    template_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("templates.id", ondelete="CASCADE"),
        nullable=False,
    )
    access_type: Mapped[AccessType] = mapped_column(
        ACCESS_TYPE_ENUM, nullable=False, default=AccessType.FREE
    )
    status: Mapped[UserTemplateStatus] = mapped_column(
        USER_TEMPLATE_STATUS_ENUM, nullable=False, default=UserTemplateStatus.ACTIVE
    )
    # SET NULL rather than CASCADE: refunding/deleting a payment revokes the
    # receipt link but must not silently delete the access grant.
    payment_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("payments.id", ondelete="SET NULL"),
    )
    acquired_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="user_templates")
    template: Mapped["Template"] = relationship(back_populates="user_templates")
    payment: Mapped[Optional["Payment"]] = relationship(back_populates="user_templates")
