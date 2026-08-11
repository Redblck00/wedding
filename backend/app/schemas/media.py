import uuid
from datetime import datetime

from app.models.enums import MediaType
from app.schemas.common import ORMModel


class MediaAssetRead(ORMModel):
    """`cloudinary_public_id` is intentionally omitted — it is an internal
    storage handle, and exposing it publicly would let anyone construct
    transformation URLs against the account.
    """

    id: uuid.UUID
    section_id: uuid.UUID | None
    type: MediaType
    url: str
    thumbnail_url: str | None
    file_size_bytes: int
    width: int | None
    height: int | None
    uploaded_at: datetime
