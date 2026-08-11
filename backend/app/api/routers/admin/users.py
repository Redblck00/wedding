from fastapi import APIRouter

router = APIRouter(prefix="/admin/users", tags=["admin:users"])

# Every route here depends on `CurrentAdmin` — see routers/admin/__init__.py,
# which applies it once at include time rather than per handler.
#
# TODO
#   GET   /admin/users              -> Page[UserRead]   ?q= search, ?role= filter
#   GET   /admin/users/{user_id}    -> UserRead + their weddings/subscriptions
#   PATCH /admin/users/{user_id}    -> UserRead
#         role changes only. Refuse to demote the last remaining admin, or the
#         panel locks everyone out.
#   DELETE /admin/users/{user_id}   -> 204
#         Cascades through weddings -> sections/media. Destroy the Cloudinary
#         files first. admin_activity_logs.admin_id has no ON DELETE, so deleting
#         an account that has logged admin actions will (correctly) fail.
#
# Write an AdminActivityLog row for every mutation here.
