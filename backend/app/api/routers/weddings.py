from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, OwnedWedding, SessionDep
from app.models.enums import WeddingStatus
from app.models.wedding import Wedding
from app.schemas.common import ErrorResponse
from app.schemas.wedding import WeddingCreate, WeddingDetailRead, WeddingRead, WeddingUpdate
from app.services import wedding_service

router = APIRouter(prefix="/weddings", tags=["weddings"])

_SLUG_TAKEN = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="That URL is already taken",
)


@router.get("", response_model=list[WeddingRead])
def list_weddings(db: SessionDep, current_user: CurrentUser) -> list[Wedding]:
    return list(
        db.scalars(
            select(Wedding)
            .where(Wedding.user_id == current_user.id)
            .order_by(Wedding.created_at.desc())
        )
    )


@router.post(
    "",
    response_model=WeddingDetailRead,
    status_code=status.HTTP_201_CREATED,
    responses={404: {"model": ErrorResponse}, 409: {"model": ErrorResponse}},
)
def create_wedding(payload: WeddingCreate, db: SessionDep, current_user: CurrentUser) -> Wedding:
    try:
        wedding_service.assert_template_usable(db, payload.template_id, current_user.id)
    except wedding_service.WeddingServiceError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    wedding = Wedding(
        user_id=current_user.id,
        template_id=payload.template_id,
        # Taken as typed. The UNIQUE constraint on weddings.slug decides whether
        # it survives — see the IntegrityError handler below.
        slug=payload.slug,
        bride_name=payload.bride_name,
        groom_name=payload.groom_name,
        wedding_date=payload.wedding_date,
        theme_color=payload.theme_color,
        font_family=payload.font_family,
    )
    db.add(wedding)

    try:
        # Flush, not commit: `wedding.id` is needed to seed sections, and both
        # must land in the same transaction — a wedding with no sections would
        # be an empty editor.
        db.flush()
        wedding_service.seed_sections(db, wedding)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise _SLUG_TAKEN from exc

    db.refresh(wedding)
    return wedding


@router.get(
    "/{wedding_id}",
    response_model=WeddingDetailRead,
    responses={404: {"model": ErrorResponse}},
)
def read_wedding(wedding: OwnedWedding, db: SessionDep) -> Wedding:
    # selectinload keeps the editor view at a handful of queries instead of one
    # per section, venue and photo.
    return db.scalar(
        select(Wedding)
        .where(Wedding.id == wedding.id)
        .options(
            selectinload(Wedding.sections),
            selectinload(Wedding.venues),
            selectinload(Wedding.media_assets),
            selectinload(Wedding.template),
        )
    )


@router.patch(
    "/{wedding_id}",
    response_model=WeddingRead,
    responses={404: {"model": ErrorResponse}, 409: {"model": ErrorResponse}},
)
def update_wedding(payload: WeddingUpdate, wedding: OwnedWedding, db: SessionDep) -> Wedding:
    # ⚠ A slug change breaks every invitation link and QR code already handed
    # out — the frontend should warn before allowing it.
    changes = payload.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(wedding, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise _SLUG_TAKEN from exc

    db.refresh(wedding)
    return wedding


@router.delete("/{wedding_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wedding(wedding: OwnedWedding, db: SessionDep) -> None:
    # ⚠ The Cloudinary files are not destroyed here. The DB cascade removes the
    # media_assets rows, taking their public_ids with them, so the uploads are
    # then unreachable and billed forever. Sweep them first once media deletion
    # is battle-tested — see routers/media.py.
    db.delete(wedding)
    db.commit()


@router.post(
    "/{wedding_id}/publish",
    response_model=WeddingRead,
    responses={404: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
)
def publish_wedding(wedding: OwnedWedding, db: SessionDep) -> Wedding:
    missing = wedding_service.missing_required_sections(db, wedding)
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Fill these sections before publishing: {', '.join(missing)}",
        )

    wedding.status = WeddingStatus.PUBLISHED
    # Set once, on first publish — re-publishing after an unpublish should not
    # reset the original date.
    if wedding.published_at is None:
        wedding.published_at = datetime.now(UTC)

    db.commit()
    db.refresh(wedding)
    return wedding


@router.post(
    "/{wedding_id}/unpublish",
    response_model=WeddingRead,
    responses={404: {"model": ErrorResponse}},
)
def unpublish_wedding(wedding: OwnedWedding, db: SessionDep) -> Wedding:
    wedding.status = WeddingStatus.UNPUBLISHED
    db.commit()
    db.refresh(wedding)
    return wedding
