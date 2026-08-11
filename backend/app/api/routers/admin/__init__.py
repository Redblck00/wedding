from fastapi import APIRouter, Depends

from app.api.deps import get_current_admin
from app.api.routers.admin import analytics, payments, templates, users

# The admin guard is attached once, here. Declaring it per handler means a new
# route added later silently ships unprotected if someone forgets it.
admin_router = APIRouter(dependencies=[Depends(get_current_admin)])

admin_router.include_router(users.router)
admin_router.include_router(templates.router)
admin_router.include_router(payments.router)
admin_router.include_router(analytics.router)

__all__ = ["admin_router"]
