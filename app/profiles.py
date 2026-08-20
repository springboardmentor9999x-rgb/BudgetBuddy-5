from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Profile, User
from app.schemas import ProfileCreate, ProfileUpdate, ProfileResponse
from app.users import get_current_user


router = APIRouter(
    prefix="/profiles",
    tags=["Profiles"]
)


@router.post(
    "",
    response_model=ProfileResponse,
    status_code=status.HTTP_201_CREATED
)
def create_profile(
    data: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = (
        db.query(Profile)
        .filter(Profile.user_id == current_user.id)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Profile already exists"
        )

    profile = Profile(
        user_id=current_user.id,
        full_name=data.full_name,
        monthly_income=data.monthly_income,
        financial_preferences=data.financial_preferences
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


@router.get("/me", response_model=ProfileResponse)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = (
        db.query(Profile)
        .filter(Profile.user_id == current_user.id)
        .first()
    )

    if profile is None:
        raise HTTPException(404, "Profile not found")

    return profile


@router.put("/me", response_model=ProfileResponse)
def update_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = (
        db.query(Profile)
        .filter(Profile.user_id == current_user.id)
        .first()
    )

    if profile is None:
        raise HTTPException(404, "Profile not found")

    profile.full_name = data.full_name
    profile.monthly_income = data.monthly_income
    profile.financial_preferences = data.financial_preferences

    db.commit()
    db.refresh(profile)

    return profile


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = (
        db.query(Profile)
        .filter(Profile.user_id == current_user.id)
        .first()
    )

    if profile is None:
        raise HTTPException(404, "Profile not found")

    db.delete(profile)
    db.commit()

    return None