"""Password hashing and JWT issuing/verification.

Uses `bcrypt` and `PyJWT` directly rather than `passlib[bcrypt]` — passlib is
unmaintained and crashes against bcrypt >= 4.1 (`module 'bcrypt' has no
attribute '__about__'`).
"""

import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.config import settings

# bcrypt only reads the first 72 bytes of a password and raises on anything
# longer, so registration schemas must cap passwords at this length.
BCRYPT_MAX_PASSWORD_BYTES = 72

ACCESS_TOKEN_TYPE = "access"


# --- Passwords ---------------------------------------------------------------


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode(), password_hash.encode())
    except ValueError:
        # Malformed/legacy hash in the row — a failed login, not a 500.
        return False


# --- Access tokens (JWT) ------------------------------------------------------


def create_access_token(user_id: uuid.UUID, role: str) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": ACCESS_TOKEN_TYPE,
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Returns the JWT payload. Raises `jwt.PyJWTError` if invalid or expired.

    Callers (see `app/api/deps.py`) translate that into a 401.
    """
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    if payload.get("type") != ACCESS_TOKEN_TYPE:
        raise jwt.InvalidTokenError("not an access token")
    return payload


# --- Refresh tokens (opaque, stored hashed) -----------------------------------


def generate_refresh_token() -> tuple[str, str]:
    """Returns `(raw_token, token_hash)`.

    The raw token goes to the client once; only the hash is persisted in
    `refresh_tokens.token_hash`, so a database leak does not hand out sessions.
    Plain SHA-256 is enough here (unlike passwords) because the token is already
    256 bits of entropy — there is nothing to brute-force.
    """
    raw_token = secrets.token_urlsafe(32)
    return raw_token, hash_refresh_token(raw_token)


def hash_refresh_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


def refresh_token_expiry() -> datetime:
    return datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
