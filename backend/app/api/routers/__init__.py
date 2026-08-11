"""Assembles every router into the single `api_router` that `main.py` mounts."""

from fastapi import APIRouter

from app.api.routers import (
    auth,
    media,
    notifications,
    payments,
    public,
    qr,
    rsvp,
    sections,
    subscriptions,
    templates,
    users,
    venues,
    weddings,
)
from app.api.routers.admin import admin_router

api_router = APIRouter(prefix="/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(templates.router)
api_router.include_router(weddings.router)
api_router.include_router(sections.router)
api_router.include_router(venues.router)
api_router.include_router(media.router)
api_router.include_router(qr.router)
api_router.include_router(rsvp.router)
api_router.include_router(payments.router)
api_router.include_router(subscriptions.router)
api_router.include_router(notifications.router)
api_router.include_router(public.router)
api_router.include_router(admin_router)

__all__ = ["api_router"]
