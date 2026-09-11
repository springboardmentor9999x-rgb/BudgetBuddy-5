from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models import User, UserRole, Expense, Income, Budget, SavingsGoal, SystemLog, NotificationType
from app.schemas.schemas import UserOut, SystemLogOut, UserUpdate
from app.services.notification_service import log_system_action, create_notification
from app.services.email_service import send_premium_approval_email_to_user

router = APIRouter()

@router.get("/stats")
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value]))
):
    total_users = db.query(User).count()
    student_users = db.query(User).filter(User.role == UserRole.STUDENT.value).count()
    premium_users = db.query(User).filter(User.role == UserRole.PREMIUM.value).count()
    admin_users = db.query(User).filter(User.role == UserRole.ADMIN.value).count()

    total_expenses_val = db.query(func.sum(Expense.amount)).scalar() or 0.0
    total_incomes_val = db.query(func.sum(Income.amount)).scalar() or 0.0
    total_transactions_count = db.query(Expense).count() + db.query(Income).count()
    active_goals_count = db.query(SavingsGoal).count()

    return {
        "user_statistics": {
            "total_users": total_users,
            "students": student_users,
            "premium_users": premium_users,
            "admins": admin_users
        },
        "financial_overview": {
            "total_platform_income": round(total_incomes_val, 2),
            "total_platform_expense": round(total_expenses_val, 2),
            "total_transactions": total_transactions_count,
            "active_goals": active_goals_count
        }
    }

@router.get("/users", response_model=List[UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value]))
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users

@router.get("/logs", response_model=List[SystemLogOut])
def get_system_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value]))
):
    logs = db.query(SystemLog).order_by(SystemLog.timestamp.desc()).limit(limit).all()
    res = []
    for l in logs:
        user_email = l.user.email if l.user else "System"
        res.append(SystemLogOut(
            id=l.id,
            user_id=l.user_id,
            user_email=user_email,
            action=l.action,
            details=l.details,
            timestamp=l.timestamp
        ))
    return res

@router.put("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value]))
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Administrators cannot alter their own administrator role.")

    if role == UserRole.ADMIN.value:
        raise HTTPException(status_code=400, detail="Creating or promoting users to Admin role is restricted.")

    if role not in [UserRole.STUDENT.value, UserRole.PREMIUM.value]:
        raise HTTPException(status_code=400, detail="Role can only be set to 'student' or 'premium'.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role

    # Only trigger approval notification & email if student explicitly submitted a premium upgrade request!
    if role == UserRole.PREMIUM.value and user.has_pending_premium_request:
        user.has_pending_premium_request = False
        create_notification(
            db=db,
            user_id=user.id,
            title="🎉 Premium Account Approved!",
            message="Congratulations! Your request for Premium access has been approved by the administrator. Enjoy 12-month trend analytics, AI cashflow predictions, and PDF/Excel chart exports!",
            notification_type=NotificationType.SYSTEM.value
        )
        send_premium_approval_email_to_user(recipient_email=user.email, student_name=user.full_name)
    elif role != UserRole.PREMIUM.value:
        user.has_pending_premium_request = False

    db.commit()
    db.refresh(user)

    log_system_action(db=db, user_id=current_user.id, action="Admin Changed User Role", details=f"User {user.email} -> {role}")
    return user

@router.put("/users/{user_id}/status", response_model=UserOut)
def toggle_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN.value]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = is_active
    db.commit()
    db.refresh(user)

    status_str = "Activated" if is_active else "Deactivated"
    log_system_action(db=db, user_id=current_user.id, action=f"Admin {status_str} User", details=f"User {user.email}")
    return user
