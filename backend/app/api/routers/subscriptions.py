from fastapi import APIRouter

router = APIRouter(tags=["subscriptions"])

# TODO
#   GET  /plans                       -> list[SubscriptionPlanRead]  PUBLIC (pricing page)
#                                        is_active only
#   GET  /subscriptions/me            -> SubscriptionRead | None     current plan
#   POST /subscriptions               -> PaymentInitResponse
#        Body: SubscribeRequest. Creates a pending payment; the subscription row
#        is only written once the webhook confirms.
#   POST /subscriptions/{id}/cancel   -> SubscriptionRead
#        Set status='cancelled' but leave expires_at alone — a cancelled plan
#        stays usable until the period it was paid for runs out.
#
# Expiry is not an endpoint: something has to flip active -> expired once
# expires_at passes (a scheduled job, or a check on each authenticated request).
