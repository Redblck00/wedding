import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import NotificationType
from app.schemas.common import ORMModel


class NotificationRead(ORMModel):
    id: uuid.UUID
    type: NotificationType
    title: str
    message: str | None
    is_read: bool
    created_at: datetime


class NotificationMarkReadRequest(BaseModel):
    ids: list[uuid.UUID]
