from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.template import Template


class TemplateCategory(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "template_categories"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    templates: Mapped[list["Template"]] = relationship(back_populates="category")
