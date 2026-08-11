import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from app.api.deps import OwnedWedding, SessionDep
from app.models.enums import WeddingStatus
from app.models.rsvp import RsvpResponse
from app.models.wedding import Wedding
from app.schemas.common import ErrorResponse
from app.schemas.rsvp import RsvpCreate, RsvpListResponse, RsvpRead, RsvpStats

# No shared prefix: one route is the guest-facing public submit, the other is the
# owner's inbox, and they sit on different paths.
router = APIRouter(tags=["rsvp"])


@router.post(
    "/wedding/{slug}/rsvp",
    response_model=RsvpRead,
    status_code=status.HTTP_201_CREATED,
    responses={404: {"model": ErrorResponse}},
)
def submit_rsvp(slug: str, payload: RsvpCreate, db: SessionDep) -> RsvpResponse:
    """PUBLIC — no auth. Anyone with the link can post here.

    ⚠ Still unthrottled. Before this link is shared anywhere real it needs a
    per-IP rate limit (slowapi, or a Redis counter), otherwise the table can be
    flooded by a single client.
    """
    wedding = db.scalar(
        select(Wedding).where(
            Wedding.slug == slug,
            # Draft and unpublished invitations must not collect replies, and
            # returning 404 keeps their existence unconfirmed.
            Wedding.status == WeddingStatus.PUBLISHED,
        )
    )
    if wedding is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")

    response = RsvpResponse(wedding_id=wedding.id, **payload.model_dump())
    db.add(response)
    db.commit()
    db.refresh(response)
    return response


@router.get(
    "/weddings/{wedding_id}/rsvps",
    response_model=RsvpListResponse,
    responses={404: {"model": ErrorResponse}},
)
def list_rsvps(wedding: OwnedWedding, db: SessionDep) -> RsvpListResponse:
    # Aggregated in SQL rather than by counting a loaded list — a popular
    # invitation's replies should never all be pulled into memory for a total.
    totals = db.execute(
        select(
            func.count(RsvpResponse.id),
            func.count(RsvpResponse.id).filter(RsvpResponse.attending.is_(True)),
            func.coalesce(
                func.sum(RsvpResponse.number_of_guests).filter(
                    RsvpResponse.attending.is_(True)
                ),
                0,
            ),
        ).where(RsvpResponse.wedding_id == wedding.id)
    ).one()

    total_responses, attending_count, total_guests = totals

    items = db.scalars(
        select(RsvpResponse)
        .where(RsvpResponse.wedding_id == wedding.id)
        .order_by(RsvpResponse.responded_at.desc())
    ).all()

    return RsvpListResponse(
        stats=RsvpStats(
            total_responses=total_responses,
            attending_count=attending_count,
            declined_count=total_responses - attending_count,
            total_guests=int(total_guests),
        ),
        items=[RsvpRead.model_validate(item) for item in items],
    )


@router.delete(
    "/weddings/{wedding_id}/rsvps/{rsvp_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"model": ErrorResponse}},
)
def delete_rsvp(rsvp_id: uuid.UUID, wedding: OwnedWedding, db: SessionDep) -> None:
    """Lets the couple remove spam — the submit endpoint is open to anyone."""
    response = db.scalar(
        select(RsvpResponse).where(
            RsvpResponse.id == rsvp_id, RsvpResponse.wedding_id == wedding.id
        )
    )
    if response is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Response not found")

    db.delete(response)
    db.commit()
