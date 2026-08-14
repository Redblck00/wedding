from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Database ---
    database_url: str

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
