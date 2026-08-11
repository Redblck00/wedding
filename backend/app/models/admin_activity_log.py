import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import CreatedAtMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class AdminActivityLog(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    """Audit trail of admin actions.

    No ON DELETE on `admin_id` — deleting an admin account must fail rather than
    quietly erase what that account did.
    """

    __tablename__ = "admin_activity_logs"

    admin_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    # Polymorphic target, e.g. ("template", <uuid>) — no FK for the same reason
    # as `payments.reference_id`.
    target_type: Mapped[str | None] = mapped_column(String(100))
    target_id: Mapped[Optional[uuid.UUID]] = mapped_column(PgUUID(as_uuid=True))

    admin: Mapped["User"] = relationship(back_populates="admin_activity_logs")
