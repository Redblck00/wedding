import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request, Response, status
from sqlalchemy import ColumnElement, func, select
from sqlalchemy.orm import Session

from app.api.deps import OwnedWedding, SessionDep, enforce_rate_limit
from app.config import settings
from app.models.enums import WeddingStatus
from app.models.rsvp import RsvpResponse
from app.models.wedding import Wedding
from app.schemas.common import ErrorResponse
from app.schemas.rsvp import RsvpCreate, RsvpListResponse, RsvpRead, RsvpStats

# No shared prefix: one route is the guest-facing public submit, the other is the
# owner's inbox, and they sit on different paths.
router = APIRouter(tags=["rsvp"])


def _same_value(column: ColumnElement, value: object) -> ColumnElement[bool]:
    """`column = value`, or `column IS NULL` when the value is missing.

    `column == None` renders as IS NULL on its own, but only by implicit
    conversion — spelled out here so an optional field cannot quietly compare as
    `= NULL`, which is NULL and therefore matches nothing.
    """
    return column.is_(None) if value is None else column == value


def _recent_identical_reply(
    db: Session, wedding_id: uuid.UUID, payload: RsvpCreate
) -> RsvpResponse | None:
    """The same reply already recorded moments ago, if there is one.

    Every field has to match: a guest who resubmits with a different headcount
    is correcting their answer, not double-clicking, and that reply is a new row
    the couple can see and reconcile. Name is compared case- and space-blind so
    "Bat " and "bat" are one person; `btrim` covers rows written before the
    schema started stripping on the way in.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(
        seconds=settings.rsvp_duplicate_window_seconds
    )
    return db.scalar(
        select(RsvpResponse).where(
            RsvpResponse.wedding_id == wedding_id,
            RsvpResponse.responded_at >= cutoff,
            func.lower(func.btrim(RsvpResponse.guest_name)) == payload.guest_name.lower(),
            RsvpResponse.attending.is_(payload.attending),
            RsvpResponse.number_of_guests == payload.number_of_guests,
            _same_value(RsvpResponse.guest_contact, payload.guest_contact),
            _same_value(RsvpResponse.message, payload.message),
        )
        # Oldest first: rows predating this guard can already contain a pair of
        # identical replies, and the resubmit should keep resolving to the same
        # one of them rather than whichever the planner happens to return.
        .order_by(RsvpResponse.responded_at)
    )


@router.post(
    "/wedding/{slug}/rsvp",
    response_model=RsvpRead,
    status_code=status.HTTP_201_CREATED,
    responses={404: {"model": ErrorResponse}, 429: {"model": ErrorResponse}},
)
def submit_rsvp(
    slug: str, payload: RsvpCreate, request: Request, response: Response, db: SessionDep
) -> RsvpResponse:
    """PUBLIC — no auth. Anyone with the link can post here.

    Throttled per address, in two windows: a short one that a flooding script
    trips within seconds and a crowd of guests scanning the QR at once does not,
    and an hourly ceiling behind it. Both are keyed per invitation, so a burst
    aimed at one wedding cannot lock guests out of another.

    The limits are not a per-person quota and must not be tightened into one —
    see `config.py` for why an address is not a guest.
    """
    for window, limit in (
        (settings.rsvp_burst_window_seconds, settings.rsvp_burst_limit),
        (settings.rsvp_hourly_window_seconds, settings.rsvp_hourly_limit),
    ):
        # Checked before the invitation is looked up: an unknown slug should cost
        # a flooder its budget too, or the throttle is skipped by guessing wrong.
        enforce_rate_limit(
            request, bucket=f"rsvp:{window}:{slug}", limit=limit, window_seconds=window
        )

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

    # A double click, a retry on a flaky connection, a refresh of the POST — all
    # arrive as a second identical body and would otherwise show the couple the
    # same guest twice. Returning the first row makes the resubmit a no-op.
    duplicate = _recent_identical_reply(db, wedding.id, payload)
    if duplicate is not None:
        response.status_code = status.HTTP_200_OK
        return duplicate

    reply = RsvpResponse(wedding_id=wedding.id, **payload.model_dump())
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return reply


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
