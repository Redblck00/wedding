import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import PaymentProvider, PaymentStatus, PurchaseType
from app.schemas.common import ORMModel


class PaymentCreate(BaseModel):
    """Starts a checkout. `amount` is deliberately *not* accepted from the
    client — `payment_service` looks the price up from `purchase_type` +
    `reference_id`, otherwise a caller could pay 1₮ for anything.
    """

    provider: PaymentProvider
    purchase_type: PurchaseType
    reference_id: uuid.UUID


class PaymentRead(ORMModel):
    id: uuid.UUID
    amount: Decimal
    currency: str
    provider: PaymentProvider
    provider_transaction_id: str | None
    status: PaymentStatus
    purchase_type: PurchaseType
    reference_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class PaymentInitResponse(BaseModel):
    payment: PaymentRead
    # Provider-specific handoff (QPay invoice id, deeplinks, QR image, …).
    checkout: dict[str, Any] = Field(default_factory=dict)


class PaymentWebhookPayload(BaseModel):
    """Raw provider callback. Shapes differ per provider, so this stays loose —
    `payment_service` is responsible for verifying the signature and for
    confirming the amount against the provider's API before unlocking anything.
    """

    provider: PaymentProvider
    provider_transaction_id: str
    status: PaymentStatus
    raw: dict[str, Any] = Field(default_factory=dict)
