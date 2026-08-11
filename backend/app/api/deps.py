import uuid
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.models.wedding import Wedding

SessionDep = Annotated[Session, Depends(get_db)]

# Хуучин route-ууд DbSession ашигласан бол:
DbSession = SessionDep

# auto_error=False so a missing header reaches our handler and returns the same
# 401 shape as a bad token, instead of FastAPI's default 403.
_bearer_scheme = HTTPBearer(auto_error=False)

_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    db: SessionDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> User:
    if credentials is None:
        raise _CREDENTIALS_EXCEPTION

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = uuid.UUID(payload["sub"])
    except (jwt.exceptions.InvalidTokenError, KeyError, ValueError) as exc:
        # InvalidTokenError covers expired, malformed and wrong-signature tokens
        # — ExpiredSignatureError and friends all subclass it.
        raise _CREDENTIALS_EXCEPTION from exc

    # Re-read the user rather than trusting the token body: the account may have
    # been deleted, or its role downgraded, since the token was issued.
    user = db.get(User, user_id)
    if user is None:
        raise _CREDENTIALS_EXCEPTION
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_admin(user: CurrentUser) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user


CurrentAdmin = Annotated[User, Depends(get_current_admin)]


def get_owned_wedding(wedding_id: uuid.UUID, db: SessionDep, current_user: CurrentUser) -> Wedding:
    """Loads a wedding, scoped to the caller.

    The `user_id` filter is the authorization check — looking the row up by id
    and comparing afterwards is what leaks other people's invitations when
    someone forgets the comparison. 404 rather than 403 so the endpoint does not
    confirm that a wedding id exists.
    """
    wedding = db.scalar(
        select(Wedding).where(Wedding.id == wedding_id, Wedding.user_id == current_user.id)
    )
    if wedding is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wedding not found")
    return wedding


OwnedWedding = Annotated[Wedding, Depends(get_owned_wedding)]
