# Wedding Invitation SaaS — Backend

FastAPI + PostgreSQL + Cloudinary. Frontend is a separate Next.js app.

## Setup

```bash
cp .env.example .env          # then fill in DATABASE_URL and the Cloudinary keys
python -m venv venv && ./venv/Scripts/activate      # Windows
pip install -r requirements.txt
python -m scripts.init_db          # creates all 16 tables (no Alembic yet)
python -m scripts.seed_templates   # fills the template catalogue
uvicorn app.main:app --reload
```

`seed_templates` is not optional for a working install: `POST /v1/weddings`
requires a `template_id`, and the wedding's sections are copied from that
template's `template_content` rows — an empty catalogue makes the editor
unreachable. It is idempotent, so re-run it after editing the specs inside.

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
scripts/seed_templates.py  starter catalogue: categories, templates, sections
```

## Status

**Implemented — 37 endpoints**

| Area | Endpoints |
|---|---|
| Auth | `POST /v1/auth/register` `/login` `/refresh` (rotating) `/logout` |
| Users | `GET`/`PATCH /v1/users/me` |
| Templates | `GET /v1/templates/categories`, `GET /v1/templates` (`?category_id`, `?is_free`), `GET /v1/templates/{id}`, `POST .../acquire` |
| Weddings | `GET`/`POST /v1/weddings`, `GET`/`PATCH`/`DELETE /v1/weddings/{id}`, `POST .../publish` `/unpublish` |
| Sections | `GET .../sections`, `PUT`/`DELETE .../sections/{section_type}`, `PATCH .../sections/reorder` |
| Venues | `GET`/`POST .../venues`, `PATCH`/`DELETE .../venues/{id}` |
| Media | `GET`/`POST .../media`, `DELETE .../media/{id}` |
| QR | `GET .../qr` — PNG stream, generated per request |
| RSVP | `POST /v1/wedding/{slug}/rsvp` (public), `GET .../rsvps`, `DELETE .../rsvps/{id}` |
| Notifications | `GET /v1/notifications` (`?unread_only`, `?limit`), `/unread-count`, `PATCH .../read` `/read-all` |
| Public | `GET /v1/wedding/{slug}` |

All 16 models match the ERD. Services: `wedding_service` (slug allocation,
template access, section seeding, publish preconditions), `section_service`
(per-type JSONB validation), `media_service` (resize, EXIF strip, re-encode).

Template browsing is unauthenticated so the landing page can show the designs
before signup; `/acquire` records a *free* template in the caller's collection
and refuses a paid one with 402 — paid access is granted by `payment_service`
once the provider webhook confirms, never by an endpoint that needs only a login.

`POST /wedding/{slug}/rsvp` is the only endpoint open to the whole internet, and
it is guarded in two layers that answer two different problems. A per-address
throttle (10/min and 60/hour, keyed per invitation) stops a script filling the
table. A duplicate check returns the existing row — 200 rather than 201 — when
an identical reply arrives within 5 minutes, which is what a double click or a
retry looks like.

Neither is a "one guest, one reply" rule, and they must not be tightened into
one. Replies are anonymous, so the only handles are the address and the typed
name: Mongolian carriers run CGNAT, so one IP can be a whole neighbourhood, and
names repeat. A rule strict enough to enforce one reply per person would turn
real guests away silently, while the duplicate it prevents is visible in the
inbox and deletable. Guests also legitimately revise a reply — a changed
headcount is a new row on purpose. If a true one-reply-per-guest rule is ever
wanted, the honest way is an edit token handed out at submit, making the second
submit an update rather than a rejection.

`/auth/login` and `/auth/register` are throttled by the same counter, keyed
differently because the attacks differ. Registration spends budget on *every*
attempt (10/hour per address) — one person signs up once, so there is no
legitimate burst. Login counts *failures only*, in two buckets: 50/15min per
address, and 10/15min per email. The email bucket is the one that actually stops
a password guess, being indifferent to how many addresses the attempts come
from; the address bucket stays loose because CGNAT will pool other people's
typos behind it.

Two consequences are deliberate. A success clears its *email* bucket but not the
address one, so a user is never left throttled by their own typos while an
attacker holding one valid account cannot reset the address budget between
guesses at everyone else's. And failures are recorded for addresses that do not
exist, because skipping them would make a 429 mean "this account is real" and
undo the constant 401 that `login` is careful to return.

**Still stubs** — files exist and are wired into `/v1`, but declare no endpoints:
`payments`, `subscriptions`, and all four `admin/` routers. Each lists its
planned endpoints and specific traps as comments. Until `admin/templates.py`
exists, the catalogue is edited by changing the specs in
`scripts/seed_templates.py` and re-running it.

**Verified**: 28 unit checks over the pure logic (YouTube id parsing across all
URL forms, Cyrillic slug transliteration, per-section content validation and
JSON coercion, bcrypt round-trip, JWT round-trip, refresh-token hashing, image
downscale + EXIF removal), plus a 44-check pass against a live Postgres covering
the whole editor flow: catalogue browsing and filters, acquire (401/402/201 and
its idempotent repeat), wedding creation seeding 10 sections in order, the
publish gate refusing and then accepting, the public page, and the notification
feed including cross-user isolation on `PATCH /read`.

The throttling adds 35 unit checks (window expiry, key sweeping, read-only peeks
that neither spend budget nor plant a key, and `X-Forwarded-For` handling at
0/1/2 trusted proxies including a spoofed prefix) and 33 against the live
database. RSVP: the duplicate guard collapsing an identical resubmit and a
case/space variant of the name while letting a changed headcount through as a new
row, the burst limit refusing the 11th reply with a `Retry-After`, and an unknown
slug still spending budget. Auth: successful logins never counting, a run of
failures then refusing even the *correct* password, a success clearing that
email's budget, an unknown address throttling identically to a real one, and a
throttled account leaving other accounts untouched.

A section counts as filled — and so satisfies the publish gate — only when one
of its *values* is non-empty, not merely when the JSON object has keys. A
template that ships `default_content` seeds a non-empty object before the couple
has typed anything, and the earlier key-based test would have let that go
straight to guests.

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
- **Rate limiting is in-process only.** `POST /wedding/{slug}/rsvp` is throttled
  by a dict in `utils/rate_limit.py`. Correct for one uvicorn process; run
  several workers and each keeps its own counter, so the real limit becomes
  `workers x limit`. Swap `check()` for a Redis INCR + EXPIRE before scaling out
  — the signature is meant to survive that. Covers `/wedding/{slug}/rsvp`,
  `/auth/login` and `/auth/register`; the authenticated routes are still open to
  a logged-in flooder.
- **Email addresses are never verified.** `register` issues tokens immediately
  and `users` has no `email_verified_at` — it was not in `schema.sql` either.
  Nothing depends on it yet: there is no password-reset endpoint, which is the
  feature that would actually need a trustworthy address. Adding it needs a
  sending domain (SPF/DKIM), so it is blocked behind owning a domain rather than
  behind the code.
- **Payment webhooks are not implemented.** See `services/payment_service.py` —
  the signature check, amount re-verification and idempotency notes are written
  out, but the QPay/SocialPay merchant contracts are needed to finish it.
- **No test suite in the repo.** The checks described above were run ad hoc and
  not committed, so nothing re-runs them on a change. The live-database pass also
  writes and deletes real rows — it needs a throwaway database before it can
  become a committed test.
