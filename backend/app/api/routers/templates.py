"""Template marketplace — read-only for users.

Authoring (create/update/deactivate) lives in `routers/admin/templates.py`.

Browsing is deliberately unauthenticated: the landing page shows the designs
before anyone signs up. Only `/acquire` needs a caller identity.
"""

import uuid

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, SessionDep
from app.models.enums import AccessType, UserTemplateStatus
from app.models.template import Template
from app.models.template_category import TemplateCategory
from app.models.user_template import UserTemplate
from app.schemas.common import ErrorResponse
from app.schemas.template import (
    TemplateCategoryRead,
    TemplateDetailRead,
    TemplateRead,
    UserTemplateRead,
)

router = APIRouter(prefix="/templates", tags=["templates"])


# Declared before `/{template_id}`: FastAPI matches in declaration order, so the
# reverse would capture "categories" as a template_id and fail UUID parsing.
@router.get("/categories", response_model=list[TemplateCategoryRead])
def list_categories(db: SessionDep) -> list[TemplateCategory]:
    return list(db.scalars(select(TemplateCategory).order_by(TemplateCategory.name)))


@router.get("", response_model=list[TemplateRead])
def list_templates(
    db: SessionDep,
    category_id: uuid.UUID | None = None,
    is_free: bool | None = Query(default=None),
) -> list[Template]:
    # is_active=False is the admin's "stop offering this" switch, not a delete:
    # invitations already built on such a template keep rendering, it just
    # disappears from the picker. Hence the filter here rather than a DELETE.
    statement = (
        select(Template)
        .where(Template.is_active.is_(True))
        .options(selectinload(Template.category))
    )

    if category_id is not None:
        statement = statement.where(Template.category_id == category_id)
    if is_free is not None:
        statement = statement.where(Template.is_free.is_(is_free))

    return list(db.scalars(statement.order_by(Template.created_at.desc())))


@router.get(
    "/{template_id}",
    response_model=TemplateDetailRead,
    responses={404: {"model": ErrorResponse}},
)
def read_template(template_id: uuid.UUID, db: SessionDep) -> Template:
    # `contents` is the section list a new wedding is seeded from — the editor
    # previews it here before the couple commits to a design. It arrives in
    # display_order via the relationship's own order_by.
    template = db.scalar(
        select(Template)
        .where(Template.id == template_id, Template.is_active.is_(True))
        .options(selectinload(Template.category), selectinload(Template.contents))
    )
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return template


@router.post(
    "/{template_id}/acquire",
    response_model=UserTemplateRead,
    status_code=status.HTTP_201_CREATED,
    responses={
        402: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def acquire_template(
    template_id: uuid.UUID,
    response: Response,
    db: SessionDep,
    current_user: CurrentUser,
) -> UserTemplate:
    """Records a free template in the caller's collection.

    Bookkeeping only — `wedding_service.assert_template_usable` already lets a
    free template through without a grant. A paid one is unlocked by
    `payment_service` after the provider webhook confirms, never here: this
    endpoint needs nothing but a login, so granting paid access from it would
    hand the whole catalogue to anyone with an account.
    """
    template = db.get(Template, template_id)
    if template is None or not template.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    if not template.is_free:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="This template has to be purchased",
        )

    existing = db.scalar(
        select(UserTemplate).where(
            UserTemplate.user_id == current_user.id,
            UserTemplate.template_id == template_id,
        )
    )
    if existing is not None:
        # Re-activating a revoked row here would undo an admin's revoke, and the
        # template being free would make the revoke unenforceable.
        if existing.status is UserTemplateStatus.REVOKED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access to this template has been revoked",
            )
        # Idempotent: the picker can fire twice (double click, retry) and must
        # not 500 against UNIQUE (user_id, template_id).
        response.status_code = status.HTTP_200_OK
        return existing

    grant = UserTemplate(
        user_id=current_user.id,
        template_id=template_id,
        access_type=AccessType.FREE,
    )
    db.add(grant)

    try:
        db.commit()
    except IntegrityError as exc:
        # Two concurrent clicks: the other request inserted between the SELECT
        # above and this commit. Its row is the answer.
        db.rollback()
        won = db.scalar(
            select(UserTemplate).where(
                UserTemplate.user_id == current_user.id,
                UserTemplate.template_id == template_id,
            )
        )
        if won is None:
            raise exc
        response.status_code = status.HTTP_200_OK
        return won

    db.refresh(grant)
    return grant
