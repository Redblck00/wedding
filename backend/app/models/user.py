from typing import TYPE_CHECKING

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import USER_ROLE_ENUM, UserRole
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.admin_activity_log import AdminActivityLog
    from app.models.notification import Notification
    from app.models.payment import Payment
    from app.models.refresh_token import RefreshToken
    from app.models.subscription import Subscription
    from app.models.user_template import UserTemplate
    from app.models.wedding import Wedding


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # `unique=True` already builds a unique index — the extra `idx_users_email`
    # in schema.sql would have been a second, redundant index on the same column.
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    # schema.sql declared this `int`. Stored as text instead so a +976 prefix,
    # a leading zero or a separator survives the round-trip.
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    role: Mapped[UserRole] = mapped_column(USER_ROLE_ENUM, nullable=False, default=UserRole.USER)
    avatar_url: Mapped[str | None] = mapped_column(Text)

    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    weddings: Mapped[list["Wedding"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    user_templates: Mapped[list["UserTemplate"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    payments: Mapped[list["Payment"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    # No cascade: an admin's audit trail must outlive the admin account.
    admin_activity_logs: Mapped[list["AdminActivityLog"]] = relationship(back_populates="admin")
