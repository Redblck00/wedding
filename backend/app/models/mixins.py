"""Column groups shared by nearly every table.

Declarative mixins: SQLAlchemy copies each `mapped_column()` per subclass, so the
same mixin is safe to reuse across all models.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, func, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column


class UUIDPrimaryKeyMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )


class CreatedAtMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    # `onupdate` bumps this from the ORM side. The schema also installs a
    # `touch_updated_at` trigger for raw SQL updates that bypass the ORM, but
    # `scripts/init_db.py` does not create triggers — so on a create_all()-built
    # database this ORM default is the only thing keeping `updated_at` fresh.
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
