import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.wedding import Wedding


class RsvpResponse(UUIDPrimaryKeyMixin, Base):
    """A guest's reply. Written by the *public* endpoint — no auth, so the
    router throttles it per address and drops identical resubmits.

    There is no unique constraint tying a row to a guest, and there cannot be a
    useful one: replies are anonymous, so nothing here identifies a person.
    Duplicates are expected to be rare and are the couple's to delete.
    """

    __tablename__ = "rsvp_responses"

    wedding_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("weddings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    guest_name: Mapped[str] = mapped_column(String(150), nullable=False)
    guest_contact: Mapped[str | None] = mapped_column(String(150))
    attending: Mapped[bool] = mapped_column(Boolean, nullable=False)
    number_of_guests: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default=text("1")
    )
    message: Mapped[str | None] = mapped_column(Text)
    responded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    wedding: Mapped["Wedding"] = relationship(back_populates="rsvp_responses")
