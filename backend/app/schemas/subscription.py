import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel

from app.models.enums import BillingPeriod, SubscriptionStatus
from app.schemas.common import ORMModel


class SubscriptionPlanRead(ORMModel):
    id: uuid.UUID
    name: str
    billing_period: BillingPeriod
    price: Decimal
    storage_limit_mb: int
    max_websites: int
    features: dict[str, Any]
    is_active: bool


class SubscriptionRead(ORMModel):
    id: uuid.UUID
    plan: SubscriptionPlanRead
    status: SubscriptionStatus
    started_at: datetime
    expires_at: datetime | None


class SubscribeRequest(BaseModel):
    plan_id: uuid.UUID
