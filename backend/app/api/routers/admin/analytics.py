from fastapi import APIRouter

router = APIRouter(prefix="/admin/analytics", tags=["admin:analytics"])

# TODO — dashboard aggregates.
#
#   GET /admin/analytics/overview   -> totals: users, weddings (by status),
#                                      published this month, active subscriptions,
#                                      revenue (payments where status='completed')
#   GET /admin/analytics/revenue    -> ?period=day|week|month time series
#   GET /admin/analytics/templates  -> most-used templates (count of weddings),
#                                      conversion: views vs. purchases
#
# Compute these with SQL aggregates (func.count / func.sum + group_by), not by
# loading rows into Python — these tables only grow.
