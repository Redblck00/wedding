from fastapi import APIRouter

router = APIRouter(prefix="/admin/payments", tags=["admin:payments"])

# TODO
#   GET  /admin/payments                  -> Page[PaymentRead]
#        Filters: status, provider, purchase_type, date range, user_id.
#   GET  /admin/payments/{payment_id}     -> PaymentRead + the user it belongs to
#   POST /admin/payments/{payment_id}/refund  -> PaymentRead
#        Call the provider's refund API first; only mark status='refunded' once
#        it succeeds, otherwise the record claims a refund that never happened.
#        Then revoke what the payment unlocked — set the user_templates row to
#        'revoked', or cancel the subscription.
#
# Write an AdminActivityLog row for every mutation here — refunds especially.
