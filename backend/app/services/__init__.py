"""Business logic that does not belong to a single endpoint.

Services take a `Session` and plain values, and raise plain exceptions — they
deliberately import nothing from FastAPI, so they stay testable without spinning
up the app and reusable from scripts and background jobs.
"""
