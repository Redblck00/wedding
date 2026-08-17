from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# The scheme SQLAlchemy needs to reach for psycopg 3. `postgresql://` on its own
# resolves to the psycopg2 dialect, which this project does not install.
_PSYCOPG_SCHEME = "postgresql+psycopg://"

# What managed Postgres hands out. Render and Neon write the first, Heroku and
# anything modelled on it still write the second — neither names a driver, and
# neither is editable where it is generated: on Render the value arrives through
# a database link, not as text somebody types.
_DRIVERLESS_SCHEMES = ("postgresql://", "postgres://")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Database ---
    database_url: str

    @field_validator("database_url")
    @classmethod
    def _use_psycopg_driver(cls, value: str) -> str:
        """Points a driverless Postgres URL at psycopg 3.

        Without this, deploying against a managed database fails at *import* —
        `create_engine("postgresql://…")` picks the psycopg2 dialect and raises
        `ModuleNotFoundError: No module named 'psycopg2'`, which names neither
        the setting at fault nor the fix. The host is the one place the operator
        cannot easily correct it, so it is corrected here instead.

        A scheme that already names its driver is left alone: someone who wrote
        `postgresql+asyncpg://` meant it, and silently overruling that would be
        the worse surprise.
        """
        url = value.strip()

        for scheme in _DRIVERLESS_SCHEMES:
            if url.startswith(scheme):
                return f"{_PSYCOPG_SCHEME}{url[len(scheme):]}"

        if not url.startswith("postgresql+"):
            raise ValueError(
                f"DATABASE_URL must be a PostgreSQL URL, got {url.split('://')[0]!r}. "
                f"Use {_PSYCOPG_SCHEME}user:password@host/database"
            )

        return url

    # --- Auth ---
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    # --- Cloudinary ---
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    # Every upload is namespaced under this folder so one Cloudinary account can
    # host dev / staging / prod without them colliding.
    cloudinary_folder: str = "wedding-saas"

    # --- Public site ---
    # Base URL of the Next.js frontend — used to build the public invitation
    # links that QR codes point at.
    public_base_url: str = "http://localhost:3000"

    cors_origins: str = "http://localhost:3000"

    # --- Public RSVP throttle ---
    # Guests are anonymous, so an address is the only handle there is — and it is
    # a poor one: Mongolian mobile carriers run CGNAT, so a whole neighbourhood
    # can share one public IP, as can every guest on a venue's wifi. These limits
    # are therefore sized to stop a script flooding the table, NOT to ration
    # replies per person. Anything tight enough to mean "one guest, one reply"
    # would silently turn away real guests, which is the worse failure: a
    # duplicate row is visible and the couple can delete it, a refused guest is
    # invisible to everyone.
    rsvp_burst_limit: int = 10
    rsvp_burst_window_seconds: int = 60
    rsvp_hourly_limit: int = 60
    rsvp_hourly_window_seconds: int = 3600

    # An identical reply resubmitted inside this window is treated as a double
    # click and returns the first row instead of inserting a second.
    rsvp_duplicate_window_seconds: int = 300

    # --- Auth throttle ---
    # Only *failed* logins are counted, so a legitimate user is never locked out
    # by their own successful sign-ins.
    login_window_seconds: int = 900
    # Per address. Loose on purpose — the CGNAT reasoning above applies just as
    # much here, and a shared carrier address will collect other people's typos.
    login_ip_limit: int = 50
    # Per email address, and the one that actually stops a password guess: it is
    # unaffected by how many addresses the attempts come from. The cost is that
    # someone can deliberately fail against a known email to throttle its owner —
    # accepted because the window heals itself in 15 minutes and no account is
    # ever disabled, only slowed.
    login_email_limit: int = 10

    # Registration is throttled per address on every attempt, not just failures:
    # there is no legitimate reason for one address to open accounts in bulk.
    register_window_seconds: int = 3600
    register_ip_limit: int = 10

    # How many reverse proxies actually sit in front of the app. 0 means
    # X-Forwarded-For is ignored entirely — the header is client-supplied, so
    # trusting it unconditionally lets a flooder mint a fresh identity per
    # request and walk straight past every limit above. Set it to the real number
    # (1 behind a single nginx/Caddy, etc.) only once such a proxy exists.
    trusted_proxy_count: int = 0

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
