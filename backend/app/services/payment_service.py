"""Checkout pricing and the post-payment unlock.

Left as a stub because every function here depends on the QPay/SocialPay
contracts (merchant credentials, callback signature format, invoice payloads)
that the provider issues per merchant — guessing them would produce code that
looks finished and silently grants paid access for free.
"""

# TODO — server-side pricing
#   resolve_amount(db, purchase_type, reference_id) -> Decimal
#     Reads templates.price / subscription_plans.price. The client never sends an
#     amount; if it did, anyone could pay 1₮ for a paid template.
#
# TODO — checkout
#   create_payment(db, user, PaymentCreate) -> (Payment, checkout_payload)
#     Insert with status='pending', call the provider, store its invoice id in
#     provider_transaction_id, return the provider's deeplinks/QR to the client.
#
# TODO — webhook (the security-critical part)
#   handle_webhook(db, provider, raw_payload) -> Payment
#     1. Verify the provider's signature. Without this, anyone who finds the URL
#        can hand themselves paid features.
#     2. Look the Payment up by provider_transaction_id.
#     3. If it is already 'completed', return it unchanged. Providers retry, and
#        QPay does deliver duplicates — a non-idempotent handler grants twice.
#     4. Re-query the provider for the real amount/status rather than trusting
#        the callback body, and compare against payments.amount.
#     5. Only then set status='completed' and unlock, in one transaction:
#          purchase_type='template'     -> user_templates row,
#                                          access_type='purchased', payment_id set
#          purchase_type='subscription' -> subscriptions row, status='active',
#                                          expires_at from the plan's billing_period
#          (extra_storage / custom_domain / premium_animation: no table yet —
#           they need somewhere to live before they can be sold)
#     6. Insert a Notification of type 'payment_success'.
#
# TODO — refund
#   refund_payment(db, payment) -> Payment
#     Call the provider first; mark 'refunded' only on success, then revoke the
#     matching user_templates row / cancel the subscription.
