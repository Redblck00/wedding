from fastapi import APIRouter

from app.api.deps import CurrentUser, SessionDep
from app.schemas.user import UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def read_me(current_user: CurrentUser) -> UserRead:
    return UserRead.model_validate(current_user)


@router.patch("/me", response_model=UserRead)
def update_me(payload: UserUpdate, db: SessionDep, current_user: CurrentUser) -> UserRead:
    # exclude_unset so an omitted key keeps its stored value, while an explicit
    # `null` (e.g. clearing the avatar) still comes through.
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return UserRead.model_validate(current_user)
