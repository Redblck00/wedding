from fastapi import APIRouter

router = APIRouter(prefix="/notifications", tags=["notifications"])

# TODO — all owner-scoped by current_user.id.
#
#   GET   /notifications                -> list[NotificationRead]   ?unread_only=bool
#         Served by idx_notifications_user_is_read.
#   GET   /notifications/unread-count   -> {"count": int}           bell badge
#   PATCH /notifications/read           -> 204
#         Body: NotificationMarkReadRequest. Bulk update, filtered by user_id as
#         well as by id — otherwise a caller could mark someone else's rows read.
#   PATCH /notifications/read-all       -> 204
