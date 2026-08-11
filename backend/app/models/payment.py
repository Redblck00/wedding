import uuid
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Numeric, String, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import (
    PAYMENT_PROVIDER_ENUM,
    PAYMENT_STATUS_ENUM,
    PURCHASE_TYPE_ENUM,
    PaymentProvider,
    PaymentStatus,
    PurchaseType,
)
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.user_template import UserTemplate


class Payment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "payments"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(
        String(10), nullable=False, default="MNT", server_default=text("'MNT'")
    )
    provider: Mapped[PaymentProvider] = mapped_column(PAYMENT_PROVIDER_ENUM, nullable=False)
    # The provider's id for this charge — webhooks arrive keyed by this, hence
    # the index.
    provider_transaction_id: Mapped[str | None] = mapped_column(String(255), index=True)
    status: Mapped[PaymentStatus] = mapped_column(
        PAYMENT_STATUS_ENUM, nullable=False, default=PaymentStatus.PENDING, index=True
    )
    purchase_type: Mapped[PurchaseType] = mapped_column(PURCHASE_TYPE_ENUM, nullable=False)
    # Polymorphic: points at templates.id, subscriptions.id, … depending on
    # `purchase_type`. Deliberately no FK — the target table varies per row, so
    # the payment service is what must keep this honest.
    reference_id: Mapped[Optional[uuid.UUID]] = mapped_column(PgUUID(as_uuid=True))

    user: Mapped["User"] = relationship(back_populates="payments")
    user_templates: Mapped[list["UserTemplate"]] = relationship(back_populates="payment")
