from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ORMModel(BaseModel):
    """Base for response schemas built straight from SQLAlchemy rows.

    `from_attributes` is what lets a router `return wedding` (an ORM object)
    instead of hand-copying every field into a dict.
    """

    model_config = ConfigDict(from_attributes=True)


class ErrorResponse(BaseModel):
    """Shape FastAPI already uses for HTTPException — declared here so routers
    can list it under `responses={404: {"model": ErrorResponse}}` and have it
    show up in the OpenAPI docs.
    """

    detail: str


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
