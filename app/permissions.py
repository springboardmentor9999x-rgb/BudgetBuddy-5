from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import (
    Notification,
    Income,
    Expense,
    SavingsTransaction,
    User
)
from app.schemas import NotificationResponse
from app.users import get_current_user


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# ==================================================
# GET ALL NOTIFICATIONS
# ==================================================

@router.get(
    "",
    response_model=list[NotificationResponse]
)
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id
        )
        .order_by(
            Notification.created_at.desc()
        )
        .all()
    )

    return notifications


# ==================================================
# GET UNREAD NOTIFICATION COUNT
# IMPORTANT:
# THIS MUST COME BEFORE "/{notification_id}"
# ==================================================

@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    unread_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
        .count()
    )

    return {
        "unread_count": unread_count
    }


# ==================================================
# MARK ONE NOTIFICATION AS READ
# ==================================================

@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
        .first()
    )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification


# ==================================================
# GENERATE MONTHLY REPORT
# MANUAL TEST ENDPOINT
# ==================================================

@router.post(
    "/generate-monthly-report",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED
)
def generate_monthly_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Calculate total income
    total_income = (
        db.query(
            func.coalesce(
                func.sum(Income.amount),
                0
            )
        )
        .filter(
            Income.user_id == current_user.id
        )
        .scalar()
    )


    # Calculate total expenses
    total_expense = (
        db.query(
            func.coalesce(
                func.sum(Expense.amount),
                0
            )
        )
        .filter(
            Expense.user_id == current_user.id
        )
        .scalar()
    )


    # Calculate total savings contributions
    total_savings = (
        db.query(
            func.coalesce(
                func.sum(SavingsTransaction.amount),
                0
            )
        )
        .filter(
            SavingsTransaction.user_id == current_user.id
        )
        .scalar()
    )


    available_balance = (
        float(total_income)
        - float(total_expense)
        - float(total_savings)
    )


    message = (
        f"Monthly Report: Income ₹{float(total_income):,.2f}, "
        f"Expenses ₹{float(total_expense):,.2f}, "
        f"Savings ₹{float(total_savings):,.2f}, "
        f"Available Balance ₹{available_balance:,.2f}"
    )


    notification = Notification(
        user_id=current_user.id,
        message=message,
        notification_type="monthly_report",
        is_read=False
    )


    db.add(notification)
    db.commit()
    db.refresh(notification)


    return notification