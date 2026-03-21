from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import ProfileUpdate, UserResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])


def check_profile_completed(user: User) -> bool:
    required = [user.name, user.email, user.company, user.role]
    return all(required)


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_profile(
    updates: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    current_user.profile_completed = check_profile_completed(current_user)

    db.commit()
    db.refresh(current_user)
    return current_user
