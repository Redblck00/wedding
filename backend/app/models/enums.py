"""Python mirrors of the PostgreSQL ENUM types declared in the schema.

Each ENUM is instantiated **once** here and the same object is reused by every
column that needs it, so `create_all()` emits one `CREATE TYPE` per PG type even
when two tables share one (`section_type` is used by both `template_content` and
`wedding_sections`).
"""

from enum import Enum

from sqlalchemy import Enum as SAEnum


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"


class BillingPeriod(str, Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"
    LIFETIME = "lifetime"


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    TRIALING = "trialing"


class WeddingStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    UNPUBLISHED = "unpublished"


class SectionType(str, Enum):
    BRIDE_INFO = "bride_info"
    GROOM_INFO = "groom_info"
    WEDDING_STORY = "wedding_story"
    EVENT_SCHEDULE = "event_schedule"
    VENUE = "venue"
    GALLERY = "gallery"
    RSVP_FORM = "rsvp_form"
    BACKGROUND_MUSIC = "background_music"
    GIFT_INFO = "gift_info"
    DRESS_CODE = "dress_code"


class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"


class PaymentProvider(str, Enum):
    QPAY = "qpay"
    SOCIALPAY = "socialpay"
    BANK_QR = "bank_qr"
    STRIPE = "stripe"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PurchaseType(str, Enum):
    TEMPLATE = "template"
    SUBSCRIPTION = "subscription"
    EXTRA_STORAGE = "extra_storage"
    CUSTOM_DOMAIN = "custom_domain"
    PREMIUM_ANIMATION = "premium_animation"


class NotificationType(str, Enum):
    PAYMENT_SUCCESS = "payment_success"
    RSVP_UPDATE = "rsvp_update"
    PUBLISH_CONFIRMATION = "publish_confirmation"
    SUBSCRIPTION_EXPIRY = "subscription_expiry"


class AccessType(str, Enum):
    FREE = "free"
    PURCHASED = "purchased"
    PLAN_INCLUDED = "plan_included"


class UserTemplateStatus(str, Enum):
    ACTIVE = "active"
    REVOKED = "revoked"


def _pg_enum(enum_cls: type[Enum], name: str) -> SAEnum:
    """Native PG ENUM storing member *values* ('user'), not names ('USER').

    Without `values_callable` SQLAlchemy persists `USER`, which does not match
    `CREATE TYPE user_role AS ENUM ('user', 'admin')` in the schema.
    """
    return SAEnum(
        enum_cls,
        name=name,
        values_callable=lambda e: [member.value for member in e],
    )


USER_ROLE_ENUM = _pg_enum(UserRole, "user_role")
BILLING_PERIOD_ENUM = _pg_enum(BillingPeriod, "billing_period")
SUBSCRIPTION_STATUS_ENUM = _pg_enum(SubscriptionStatus, "subscription_status")
WEDDING_STATUS_ENUM = _pg_enum(WeddingStatus, "wedding_status")
SECTION_TYPE_ENUM = _pg_enum(SectionType, "section_type")
MEDIA_TYPE_ENUM = _pg_enum(MediaType, "media_type")
PAYMENT_PROVIDER_ENUM = _pg_enum(PaymentProvider, "payment_provider")
PAYMENT_STATUS_ENUM = _pg_enum(PaymentStatus, "payment_status")
PURCHASE_TYPE_ENUM = _pg_enum(PurchaseType, "purchase_type")
NOTIFICATION_TYPE_ENUM = _pg_enum(NotificationType, "notification_type")
ACCESS_TYPE_ENUM = _pg_enum(AccessType, "access_type")
USER_TEMPLATE_STATUS_ENUM = _pg_enum(UserTemplateStatus, "user_template_status")
