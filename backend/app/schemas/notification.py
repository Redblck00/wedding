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


class NotificationUnreadCount(BaseModel):
    """Bell-badge payload. An object rather than a bare int so a later addition
    (e.g. a per-type breakdown) does not change the response's JSON type.
    """

    count: int
