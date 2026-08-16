import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import OwnedWedding, SessionDep
from app.models.media_asset import MediaAsset
from app.models.venue import Venue
from app.schemas.common import ErrorResponse
from app.schemas.venue import VenueCreate, VenueRead, VenueUpdate

router = APIRouter(prefix="/weddings", tags=["venues"])


def _assert_photo_owned(db: Session, wedding_id: uuid.UUID, media_id: uuid.UUID | None) -> None:
    """Scoped to this wedding for the same reason `media.upload_media` scopes
    `section_id`: without it a caller could hang somebody else's photo on their
    own venue by passing its id, and the guest page would publish it.
    """
    if media_id is None:
        return

    owned = db.scalar(
        select(MediaAsset.id).where(
            MediaAsset.id == media_id,
            MediaAsset.wedding_id == wedding_id,
        )
    )
    if owned is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")


def _get_venue(db: Session, wedding_id: uuid.UUID, venue_id: uuid.UUID) -> Venue:
    # Filtered by wedding_id as well as venue_id. The wedding was already checked
    # against the caller, so this pairing is what stops one couple reaching
    # another couple's venue by guessing its id.
    venue = db.scalar(select(Venue).where(Venue.id == venue_id, Venue.wedding_id == wedding_id))
    if venue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found")
    return venue


@router.get("/{wedding_id}/venues", response_model=list[VenueRead])
def list_venues(wedding: OwnedWedding, db: SessionDep) -> list[Venue]:
    return list(
        db.scalars(
            select(Venue)
            .where(Venue.wedding_id == wedding.id)
            .order_by(Venue.display_order, Venue.created_at)
        )
    )


@router.post(
    "/{wedding_id}/venues",
    response_model=VenueRead,
    status_code=status.HTTP_201_CREATED,
    responses={404: {"model": ErrorResponse}},
)
def create_venue(payload: VenueCreate, wedding: OwnedWedding, db: SessionDep) -> Venue:
    _assert_photo_owned(db, wedding.id, payload.photo_media_id)

    venue = Venue(wedding_id=wedding.id, **payload.model_dump())
    db.add(venue)
    db.commit()
    db.refresh(venue)
    return venue


@router.patch(
    "/{wedding_id}/venues/{venue_id}",
    response_model=VenueRead,
    responses={404: {"model": ErrorResponse}},
)
def update_venue(
    venue_id: uuid.UUID,
    payload: VenueUpdate,
    wedding: OwnedWedding,
    db: SessionDep,
) -> Venue:
    venue = _get_venue(db, wedding.id, venue_id)

    changes = payload.model_dump(exclude_unset=True)
    # Only when the field was actually sent — `exclude_unset` lets an explicit
    # null through, which clears the photo and needs no ownership check.
    if "photo_media_id" in changes:
        _assert_photo_owned(db, wedding.id, changes["photo_media_id"])

    for field, value in changes.items():
        setattr(venue, field, value)

    db.commit()
    db.refresh(venue)
    return venue


@router.delete(
    "/{wedding_id}/venues/{venue_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"model": ErrorResponse}},
)
def delete_venue(venue_id: uuid.UUID, wedding: OwnedWedding, db: SessionDep) -> None:
    db.delete(_get_venue(db, wedding.id, venue_id))
    db.commit()
