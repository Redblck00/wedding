from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, SessionDep, client_ip, enforce_rate_limit, guard_rate_limit
from app.config import settings
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    refresh_token_expiry,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RefreshRequest, RegisterRequest
from app.schemas.common import ErrorResponse
from app.schemas.user import UserRead
from app.utils import rate_limit

router = APIRouter(prefix="/auth", tags=["auth"])

_INVALID_CREDENTIALS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Incorrect email or password",
)


def _login_keys(request: Request, email: str) -> tuple[str, str]:
    """The two buckets a login attempt is counted against.

    Two, because they catch opposite shapes of attack: one host grinding through
    many accounts trips the address bucket, while a guess at a single account
    spread over many hosts only ever shows up in the email bucket.

    Lowercased so `Bat@x.mn` and `bat@x.mn` cannot be alternated to double the
    budget — addresses are stored as typed, and the lookup below is
    case-sensitive, but an attacker is not obliged to match that.
    """
    return (
        f"auth:login:ip:{client_ip(request)}",
        f"auth:login:email:{email.strip().lower()}",
    )


def _issue_tokens(db: Session, user: User) -> AuthResponse:
    raw_token, token_hash = generate_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=refresh_token_expiry(),
        )
    )
    db.commit()

    return AuthResponse(
        access_token=create_access_token(user.id, user.role.value),
        refresh_token=raw_token,
        expires_in=settings.access_token_expire_minutes * 60,
        user=UserRead.model_validate(user),
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    responses={409: {"model": ErrorResponse}, 429: {"model": ErrorResponse}},
)
def register(payload: RegisterRequest, request: Request, db: SessionDep) -> AuthResponse:
    """Creates an account and signs it straight in — the address is not verified.

    Throttled per address on every attempt, successes included: one person signs
    up once, so there is no legitimate burst to protect, and counting only
    failures would leave bulk account creation unmetered.
    """
    enforce_rate_limit(
        request,
        bucket="auth:register",
        limit=settings.register_ip_limit,
        window_seconds=settings.register_window_seconds,
    )

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        # The unique index on users.email is the real guard — a pre-flight
        # SELECT would still lose to a concurrent signup with the same address.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from exc

    db.refresh(user)
    return _issue_tokens(db, user)


@router.post(
    "/login",
    response_model=AuthResponse,
    responses={401: {"model": ErrorResponse}, 429: {"model": ErrorResponse}},
)
def login(payload: LoginRequest, request: Request, db: SessionDep) -> AuthResponse:
    """Throttled on *failures only*, so a real user's own sign-ins never count."""
    ip_key, email_key = _login_keys(request, payload.email)
    guard_rate_limit(ip_key, limit=settings.login_ip_limit)
    guard_rate_limit(email_key, limit=settings.login_email_limit)

    user = db.scalar(select(User).where(User.email == payload.email))
    # Same message and code whether the email is unknown or the password is
    # wrong, so the endpoint cannot be used to enumerate registered addresses.
    if user is None or not verify_password(payload.password, user.password_hash):
        # Recorded for unknown addresses too — skipping them would make a 429
        # mean "this account exists" and undo the constant answer above.
        for key in (ip_key, email_key):
            rate_limit.record(key, window_seconds=settings.login_window_seconds)
        raise _INVALID_CREDENTIALS

    # Proving ownership of this account clears its budget, so a forgetful user is
    # not left throttled by earlier typos. The address bucket deliberately
    # survives: an attacker holding one valid account would otherwise reset it
    # between guesses at everyone else's.
    rate_limit.clear(email_key)
    return _issue_tokens(db, user)


@router.post("/refresh", response_model=AuthResponse, responses={401: {"model": ErrorResponse}})
def refresh(payload: RefreshRequest, db: SessionDep) -> AuthResponse:
    token_hash = hash_refresh_token(payload.refresh_token)
    stored = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))

    if stored is None or stored.revoked or stored.expires_at <= datetime.now(UTC):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    stored.revoked = True
    user = db.get(User, stored.user_id)
    if user is None:
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    return _issue_tokens(db, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: RefreshRequest, db: SessionDep, current_user: CurrentUser) -> None:
    stored = db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_refresh_token(payload.refresh_token),
            RefreshToken.user_id == current_user.id,
        )
    )
    # Silent no-op when the token is unknown: logout should be idempotent and
    # must not reveal whether a given token exists.
    if stored is not None:
        stored.revoked = True
        db.commit()
