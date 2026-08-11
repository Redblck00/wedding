"""Every model must be imported here.

`Base.metadata` only knows about a table once its module has been imported, so a
model missing from this list is silently skipped by `scripts/init_db.py` and by
Alembic autogenerate.
"""

from app.models.admin_activity_log import AdminActivityLog
from app.models.media_asset import MediaAsset
from app.models.notification import Notification
from app.models.payment import Payment
from app.models.refresh_token import RefreshToken
from app.models.rsvp import RsvpResponse
from app.models.subscription import Subscription
from app.models.subscription_plan import SubscriptionPlan
from app.models.template import Template
from app.models.template_category import TemplateCategory
from app.models.template_content import TemplateContent
from app.models.user import User
from app.models.user_template import UserTemplate
from app.models.venue import Venue
from app.models.wedding import Wedding
from app.models.wedding_section import WeddingSection

__all__ = [
    "AdminActivityLog",
    "MediaAsset",
    "Notification",
    "Payment",
    "RefreshToken",
    "RsvpResponse",
    "Subscription",
    "SubscriptionPlan",
    "Template",
    "TemplateCategory",
    "TemplateContent",
    "User",
    "UserTemplate",
    "Venue",
    "Wedding",
    "WeddingSection",
]
