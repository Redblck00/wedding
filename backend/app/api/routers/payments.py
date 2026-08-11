from fastapi import APIRouter

router = APIRouter(prefix="/payments", tags=["payments"])

# TODO — checkout + provider callbacks. All the risk in this file is in the webhook.
#
#   POST /payments            -> PaymentInitResponse  201
#        Body: PaymentCreate (provider, purchase_type, reference_id).
#        payment_service prices it server-side from purchase_type + reference_id —
#        never take `amount` from the client.
#   GET  /payments            -> list[PaymentRead]   caller's own history
#   GET  /payments/{id}       -> PaymentRead         status polling
#
#   POST /payments/webhook/{provider}   -> 200, PUBLIC
#        ⚠ Verify the provider's signature before touching anything, and re-check
#          the amount against the provider's API — this endpoint is open to the
#          internet and its side effect is granting paid access.
#        ⚠ Must be idempotent: providers retry, and QPay will deliver the same
#          callback more than once. Key off provider_transaction_id and ignore a
#          payment already marked completed, or the user gets two grants.
#        On success payment_service unlocks: user_templates row for `template`,
#        subscriptions row for `subscription`, then a notification.
