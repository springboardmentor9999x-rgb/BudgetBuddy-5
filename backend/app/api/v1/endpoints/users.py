from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models import User, UserRole, NotificationType
from app.schemas.schemas import UserOut, UserUpdate
from app.services.notification_service import log_system_action, create_notification
from app.services.email_service import send_premium_request_email_to_admin

router = APIRouter()

@router.get("/", response_model=List[UserOut])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value]))
):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.put("/me", response_model=UserOut)
def update_me(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_in.email and user_in.email != current_user.email:
        existing = db.query(User).filter(User.email == user_in.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = user_in.email
    if user_in.full_name:
        current_user.full_name = user_in.full_name

    db.commit()
    db.refresh(current_user)
    log_system_action(db=db, user_id=current_user.id, action="User Profile Updated")
    return current_user

@router.post("/request-premium")
def request_premium_upgrade(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in [UserRole.PREMIUM.value, UserRole.ADMIN.value]:
        raise HTTPException(
            status_code=400,
            detail=f"Your account is already a {current_user.role.upper()} account!"
        )

    # 1. Mark request pending on user account
    current_user.has_pending_premium_request = True
    db.commit()
    db.refresh(current_user)

    # 2. Find all active Admin users
    admin_users = db.query(User).filter(User.role == UserRole.ADMIN.value, User.is_active == True).all()

    # 3. Trigger in-app notification & email for each admin
    for admin in admin_users:
        create_notification(
            db=db,
            user_id=admin.id,
            title="⭐ New Premium Upgrade Request",
            message=f"User {current_user.full_name} ({current_user.email}) submitted a request to upgrade to Premium.",
            notification_type=NotificationType.PREMIUM_REQUEST.value
        )
        send_premium_request_email_to_admin(
            admin_email=admin.email,
            student_name=current_user.full_name,
            student_email=current_user.email
        )

    # 4. Log system audit action
    log_system_action(
        db=db,
        user_id=current_user.id,
        action="Requested Premium Upgrade",
        details=f"Student {current_user.email} submitted upgrade request to admins"
    )

    return {"message": "Premium upgrade request submitted to administrator successfully!"}
