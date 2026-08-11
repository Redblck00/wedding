from decimal import Decimal
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, Integer, Numeric, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import BILLING_PERIOD_ENUM, BillingPeriod
from app.models.mixins import CreatedAtMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.subscription import Subscription


class SubscriptionPlan(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "subscription_plans"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    billing_period: Mapped[BillingPeriod] = mapped_column(BILLING_PERIOD_ENUM, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    storage_limit_mb: Mapped[int] = mapped_column(Integer, nullable=False)
    max_websites: Mapped[int] = mapped_column(Integer, nullable=False)
    # Free-form feature flags, e.g. {"custom_domain": true, "premium_animations": true}.
    features: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default=text("'{}'::jsonb")
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )

    subscriptions: Mapped[list["Subscription"]] = relationship(back_populates="plan")
