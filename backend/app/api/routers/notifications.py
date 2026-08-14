"""In-app notification feed. Every route is scoped to `current_user.id`.

Rows are written by whatever produced the event (a payment webhook, an RSVP, a
publish); this router only reads them and flips `is_read`.
"""

from fastapi import APIRouter, Query, status
from sqlalchemy import func, select, update

from app.api.deps import CurrentUser, SessionDep
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationMarkReadRequest,
    NotificationRead,
    NotificationUnreadCount,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationRead])
def list_notifications(
    db: SessionDep,
    current_user: CurrentUser,
    unread_only: bool = False,
    limit: int = Query(default=50, ge=1, le=200),
) -> list[Notification]:
    # Capped: the bell dropdown wants the recent few, and an account left open
    # for a year would otherwise stream its whole history on every poll.
    statement = select(Notification).where(Notification.user_id == current_user.id)

    if unread_only:
        # This pairing — user_id plus is_read — is what idx_notifications_user_is_read
        # was built for.
        statement = statement.where(Notification.is_read.is_(False))

    # The id tiebreak is not cosmetic: `now()` is the transaction's clock, so
    # rows written together share a created_at, and ordering by it alone lets
    # the capped window reshuffle between two polls — dropping or repeating a
    # row the user has not seen.
    statement = statement.order_by(Notification.created_at.desc(), Notification.id.desc())

    return list(db.scalars(statement.limit(limit)))


@router.get("/unread-count", response_model=NotificationUnreadCount)
def unread_count(db: SessionDep, current_user: CurrentUser) -> NotificationUnreadCount:
    # COUNT rather than len(list_notifications(...)): the badge needs the real
    # total, and the capped list above cannot give it.
    total = db.scalar(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read.is_(False))
    )
    return NotificationUnreadCount(count=total or 0)


@router.patch("/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_read(
    payload: NotificationMarkReadRequest,
    db: SessionDep,
    current_user: CurrentUser,
) -> None:
    if not payload.ids:
        return

    db.execute(
        update(Notification)
        .where(
            # The user_id filter is the authorization check, not a convenience:
            # without it any caller could mark a stranger's rows read by id.
            Notification.user_id == current_user.id,
            Notification.id.in_(payload.ids),
            Notification.is_read.is_(False),
        )
        .values(is_read=True)
        # The session is discarded right after the commit, so there is nothing
        # left to keep in sync — and the default strategy would issue an extra
        # SELECT to do it.
        .execution_options(synchronize_session=False)
    )
    db.commit()


@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(db: SessionDep, current_user: CurrentUser) -> None:
    db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read.is_(False))
        .values(is_read=True)
        .execution_options(synchronize_session=False)
    )
    db.commit()
