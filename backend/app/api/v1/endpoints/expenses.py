from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, Expense, Budget, BankAccount, Profile, NotificationType
from app.schemas.schemas import ExpenseCreate, ExpenseUpdate, ExpenseOut
from app.services.notification_service import create_notification
from app.services.email_service import send_budget_alert_email

router = APIRouter()

def check_budget_alerts(db: Session, user_id: int, category: str, expense_date: datetime, new_expense_amount: float = 0.0):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return

    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    alert_threshold = profile.overspending_alert_threshold if (profile and profile.overspending_alert_threshold) else 80.0
    email_enabled = profile.email_notifications_enabled if (profile and profile.email_notifications_enabled is not None) else True

    month_str = expense_date.strftime("%Y-%m")
    budget = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.category == category,
        Budget.month == month_str
    ).first()

    if budget and budget.amount_allocated > 0:
        new_total_spent = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.category == category,
            Expense.date.like(f"{month_str}%")
        ).scalar() or 0.0

        old_total_spent = max(0.0, new_total_spent - new_expense_amount)
        old_pct = (old_total_spent / budget.amount_allocated) * 100
        new_pct = (new_total_spent / budget.amount_allocated) * 100

        # 1. Exceeded Budget Milestone (>= 100%)
        if old_pct < 100 and new_pct >= 100:
            create_notification(
                db=db,
                user_id=user_id,
                title=f"⚠️ Budget Exceeded: {category}",
                message=f"You have spent ${new_total_spent:,.2f} on {category}, exceeding your limit of ${budget.amount_allocated:,.2f} for {month_str}!",
                notification_type=NotificationType.OVERSPENDING.value
            )
            if email_enabled:
                send_budget_alert_email(
                    recipient_email=user.email,
                    user_name=user.full_name,
                    category=category,
                    total_spent=new_total_spent,
                    budget_limit=budget.amount_allocated,
                    percent_used=new_pct,
                    month_str=month_str,
                    is_exceeded=True
                )
        # 2. Warning Threshold Milestone (e.g. 80%)
        elif old_pct < alert_threshold and new_pct >= alert_threshold and new_pct < 100:
            create_notification(
                db=db,
                user_id=user_id,
                title=f"⚡ Budget Warning: {category}",
                message=f"You have used {new_pct:.1f}% (${new_total_spent:,.2f} / ${budget.amount_allocated:,.2f}) of your {category} budget for {month_str}.",
                notification_type=NotificationType.BUDGET_ALERT.value
            )
            if email_enabled:
                send_budget_alert_email(
                    recipient_email=user.email,
                    user_name=user.full_name,
                    category=category,
                    total_spent=new_total_spent,
                    budget_limit=budget.amount_allocated,
                    percent_used=new_pct,
                    month_str=month_str,
                    is_exceeded=False
                )
        # 3. Halfway Milestone (>= 50%)
        elif old_pct < 50 and new_pct >= 50 and new_pct < alert_threshold:
            create_notification(
                db=db,
                user_id=user_id,
                title=f"⚡ 50% Budget Milestone: {category}",
                message=f"You have used {new_pct:.1f}% (${new_total_spent:,.2f} / ${budget.amount_allocated:,.2f}) of your {category} budget for {month_str}.",
                notification_type=NotificationType.BUDGET_ALERT.value
            )
            if email_enabled:
                send_budget_alert_email(
                    recipient_email=user.email,
                    user_name=user.full_name,
                    category=category,
                    total_spent=new_total_spent,
                    budget_limit=budget.amount_allocated,
                    percent_used=new_pct,
                    month_str=month_str,
                    is_exceeded=False
                )

@router.get("/", response_model=List[ExpenseOut])
def get_expenses(
    category: Optional[str] = None,
    month: Optional[str] = None, # YYYY-MM
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    if category:
        query = query.filter(Expense.category == category)
    if month:
        query = query.filter(Expense.date.like(f"{month}%"))
    if search:
        query = query.filter(Expense.title.ilike(f"%{search}%"))

    return query.order_by(Expense.date.desc()).all()

@router.post("/", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = Expense(
        user_id=current_user.id,
        bank_account_id=expense_in.bank_account_id,
        title=expense_in.title,
        amount=expense_in.amount,
        category=expense_in.category,
        date=expense_in.date,
        payment_method=expense_in.payment_method,
        notes=expense_in.notes
    )
    db.add(expense)

    # Deduct amount from linked BankAccount balance & enforce limit guard
    if expense_in.bank_account_id:
        bank = db.query(BankAccount).filter(BankAccount.id == expense_in.bank_account_id, BankAccount.user_id == current_user.id).first()
        if bank:
            if bank.account_limit > 0 and bank.account_type == "credit_card":
                current_used = abs(bank.current_balance)
                if (current_used + expense_in.amount) > bank.account_limit:
                    avail = max(0.0, bank.account_limit - current_used)
                    raise HTTPException(
                        status_code=400,
                        detail=f"Card limit exceeded! Expense of ${expense_in.amount:,.2f} exceeds your {bank.bank_name} credit limit of ${bank.account_limit:,.2f}. (Available credit: ${avail:,.2f})"
                    )
            bank.current_balance -= expense_in.amount

    db.commit()
    db.refresh(expense)

    # Trigger budget check & notifications
    check_budget_alerts(db, current_user.id, expense.category, expense.date, new_expense_amount=expense.amount)

    create_notification(
        db=db,
        user_id=current_user.id,
        title="💸 Expense Added",
        message=f"Expense '{expense.title}' (${expense.amount:,.2f}) added under {expense.category}.",
        notification_type=NotificationType.SYSTEM.value
    )

    return expense

@router.put("/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: int,
    expense_in: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense entry not found")

    update_data = expense_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)

    check_budget_alerts(db, current_user.id, expense.category, expense.date, new_expense_amount=expense.amount)

    create_notification(
        db=db,
        user_id=current_user.id,
        title="✏️ Expense Updated",
        message=f"Expense '{expense.title}' updated to ${expense.amount:,.2f}.",
        notification_type=NotificationType.SYSTEM.value
    )

    return expense

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense entry not found")

    title = expense.title
    amount = expense.amount

    db.delete(expense)
    db.commit()

    create_notification(
        db=db,
        user_id=current_user.id,
        title="🗑️ Expense Deleted",
        message=f"Expense '{title}' (${amount:,.2f}) was removed.",
        notification_type=NotificationType.SYSTEM.value
    )

    return None
