# Wedding Invitation SaaS — Backend

FastAPI + PostgreSQL + Cloudinary. Frontend is a separate Next.js app.

## Setup

```bash
cp .env.example .env          # then fill in DATABASE_URL and the Cloudinary keys
python -m venv venv && ./venv/Scripts/activate      # Windows
pip install -r requirements.txt
python -m scripts.init_db     # creates all 16 tables (no Alembic yet)
uvicorn app.main:app --reload
```

`DATABASE_URL` must use the `postgresql+psycopg://` scheme — this project runs
psycopg 3, and a bare `postgresql://` URL makes SQLAlchemy look for psycopg2,
which is not installed.

API docs: <http://localhost:8000/docs>

## Layout

```
app/
  config.py          .env -> Settings (pydantic-settings)
  database.py        engine, SessionLocal, get_db, Base
  core/security.py   bcrypt hashing, JWT issue/verify, refresh-token hashing
  api/
    deps.py          SessionDep, CurrentUser, CurrentAdmin
    routers/         one module per resource; __init__.py assembles api_router (/v1)
      admin/         admin routes; the admin guard is applied once in __init__.py
  models/            SQLAlchemy, one file per table (+ enums.py, mixins.py)
  schemas/           Pydantic request/response
  services/          business logic, no FastAPI imports
  utils/             slugify, Cloudinary client, YouTube id parser
scripts/init_db.py   create_all() shortcut
```

## Status

**Implemented — 22 endpoints**

| Area | Endpoints |
|---|---|
| Auth | `POST /v1/auth/register` `/login` `/refresh` (rotating) `/logout` |
| Users | `GET`/`PATCH /v1/users/me` |
| Weddings | `GET`/`POST /v1/weddings`, `GET`/`PATCH`/`DELETE /v1/weddings/{id}`, `POST .../publish` `/unpublish` |
| Sections | `GET .../sections`, `PUT`/`DELETE .../sections/{section_type}`, `PATCH .../sections/reorder` |
| Venues | `GET`/`POST .../venues`, `PATCH`/`DELETE .../venues/{id}` |
| Media | `GET`/`POST .../media`, `DELETE .../media/{id}` |
| QR | `GET .../qr` — PNG stream, generated per request |
| RSVP | `POST /v1/wedding/{slug}/rsvp` (public), `GET .../rsvps`, `DELETE .../rsvps/{id}` |
| Public | `GET /v1/wedding/{slug}` |

All 16 models match the ERD. Services: `wedding_service` (slug allocation,
template access, section seeding, publish preconditions), `section_service`
(per-type JSONB validation), `media_service` (resize, EXIF strip, re-encode).

**Still stubs** — files exist and are wired into `/v1`, but declare no endpoints:
`templates`, `payments`, `subscriptions`, `notifications`, and all four `admin/`
routers. Each lists its planned endpoints and specific traps as comments.

**Verified**: 28 unit checks over the pure logic (YouTube id parsing across all
URL forms, Cyrillic slug transliteration, per-section content validation and
JSON coercion, bcrypt round-trip, JWT round-trip, refresh-token hashing, image
downscale + EXIF removal). Not yet exercised against a live database.

## Deliberate deviations from schema.sql

- **`users.phone` is `VARCHAR(20)`, not `int`.** An integer column loses a `+976`
  prefix, a leading zero and any separator.
- **`media_assets` has an extra `cloudinary_public_id`.** Cloudinary's destroy
  API takes a public_id, not a URL — without this column an uploaded file can
  never be deleted, and the account keeps being billed for it.
- **`idx_users_email` and `idx_weddings_slug` dropped.** `UNIQUE` already builds
  an index on those columns; the explicit ones were a second copy.

## Known gaps

- **No Alembic migrations.** `init_db.py` runs `create_all()`, which can only
  create — it silently ignores a column added to an existing table. Alembic is
  installed; switch before there is data worth keeping.
- **No rate limiting.** `POST /wedding/{slug}/rsvp` is public and unthrottled by
  design-so-far; it needs a per-IP limit before an invitation link is shared.
- **Payment webhooks are not implemented.** See `services/payment_service.py` —
  the signature check, amount re-verification and idempotency notes are written
  out, but the QPay/SocialPay merchant contracts are needed to finish it.
- **No tests.**
