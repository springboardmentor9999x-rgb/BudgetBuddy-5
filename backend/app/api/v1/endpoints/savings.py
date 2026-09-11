from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, SavingsGoal, Income, Expense, BankAccount, Profile, NotificationType
from app.schemas.schemas import SavingsGoalCreate, SavingsGoalUpdate, SavingsContribution, SavingsGoalOut
from app.services.notification_service import create_notification
from app.services.email_service import send_savings_milestone_email
from sqlalchemy import func

router = APIRouter()

def build_savings_response(goal: SavingsGoal) -> SavingsGoalOut:
    pct = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0.0
    return SavingsGoalOut(
        id=goal.id,
        user_id=goal.user_id,
        title=goal.title,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        target_date=goal.target_date,
        category=goal.category,
        is_completed=goal.is_completed or pct >= 100,
        progress_percentage=round(min(pct, 100.0), 1),
        created_at=goal.created_at
    )

@router.get("/", response_model=List[SavingsGoalOut])
def get_savings_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).order_by(SavingsGoal.created_at.desc()).all()
    return [build_savings_response(g) for g in goals]

@router.post("/", response_model=SavingsGoalOut, status_code=status.HTTP_201_CREATED)
def create_savings_goal(
    goal_in: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = SavingsGoal(
        user_id=current_user.id,
        title=goal_in.title,
        target_amount=goal_in.target_amount,
        current_amount=goal_in.current_amount,
        target_date=goal_in.target_date,
        category=goal_in.category,
        description=goal_in.description,
        is_completed=goal_in.current_amount >= goal_in.target_amount
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    create_notification(
        db=db,
        user_id=current_user.id,
        title="🏦 Savings Goal Created",
        message=f"Savings goal '{goal.title}' (${goal.target_amount:,.2f} target) established.",
        notification_type=NotificationType.SYSTEM.value
    )

    return build_savings_response(goal)

@router.post("/{goal_id}/deposit", response_model=SavingsGoalOut)
def deposit_savings(
    goal_id: int,
    deposit: SavingsContribution,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")

    if deposit.amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be greater than $0.00")

    # Calculate savings in OTHER goals (excluding the current goal being deposited into)
    other_savings = db.query(func.sum(SavingsGoal.current_amount)).filter(
        SavingsGoal.user_id == current_user.id,
        SavingsGoal.id != goal_id
    ).scalar() or 0.0

    total_income = db.query(func.sum(Income.amount)).filter(Income.user_id == current_user.id).scalar() or 0.0
    total_expense = db.query(func.sum(Expense.amount)).filter(Expense.user_id == current_user.id).scalar() or 0.0
    total_bank_balance = db.query(func.sum(BankAccount.current_balance)).filter(BankAccount.user_id == current_user.id).scalar() or 0.0

    # Unallocated income balance & liquid bank balance
    unallocated_income = total_income - total_expense - other_savings - goal.current_amount
    liquid_bank = total_bank_balance

    # Available funds for deposit
    available_funds = max(unallocated_income, liquid_bank)
    has_financial_records = (total_income > 0 or total_expense > 0 or total_bank_balance > 0)

    if has_financial_records and deposit.amount > available_funds:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient available funds (${max(0.0, available_funds):,.2f} remaining). You cannot deposit ${deposit.amount:,.2f} into savings."
        )

    old_pct = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0.0
    goal.current_amount += deposit.amount
    new_pct = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0.0

    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    email_enabled = profile.email_notifications_enabled if (profile and profile.email_notifications_enabled is not None) else True

    if new_pct >= 100 and not goal.is_completed:
        goal.is_completed = True
        create_notification(
            db=db,
            user_id=current_user.id,
            title="🎉 Savings Goal Completed!",
            message=f"Congratulations! You reached 100% of your target amount (${goal.target_amount:,.2f}) for '{goal.title}'!",
            notification_type=NotificationType.GOAL_MILESTONE.value
        )
        if email_enabled:
            send_savings_milestone_email(
                recipient_email=current_user.email,
                user_name=current_user.full_name,
                goal_title=goal.title,
                current_amount=goal.current_amount,
                target_amount=goal.target_amount,
                percent_reached=new_pct,
                is_completed=True
            )
    elif old_pct < 80 and new_pct >= 80 and new_pct < 100:
        create_notification(
            db=db,
            user_id=current_user.id,
            title="🎯 80% Savings Goal Milestone!",
            message=f"Awesome work! You are now 80% of the way (${goal.current_amount:,.2f} / ${goal.target_amount:,.2f}) to your '{goal.title}' goal!",
            notification_type=NotificationType.GOAL_MILESTONE.value
        )
        if email_enabled:
            send_savings_milestone_email(
                recipient_email=current_user.email,
                user_name=current_user.full_name,
                goal_title=goal.title,
                current_amount=goal.current_amount,
                target_amount=goal.target_amount,
                percent_reached=new_pct,
                is_completed=False
            )
    elif old_pct < 50 and new_pct >= 50 and new_pct < 80:
        create_notification(
            db=db,
            user_id=current_user.id,
            title="⚡ 50% Savings Goal Halfway Milestone!",
            message=f"Halfway there! You have saved 50% (${goal.current_amount:,.2f} / ${goal.target_amount:,.2f}) for '{goal.title}'.",
            notification_type=NotificationType.GOAL_MILESTONE.value
        )
        if email_enabled:
            send_savings_milestone_email(
                recipient_email=current_user.email,
                user_name=current_user.full_name,
                goal_title=goal.title,
                current_amount=goal.current_amount,
                target_amount=goal.target_amount,
                percent_reached=new_pct,
                is_completed=False
            )
    else:
        create_notification(
            db=db,
            user_id=current_user.id,
            title="💰 Savings Goal Deposit",
            message=f"Deposited ${deposit.amount:,.2f} into '{goal.title}'. Total saved: ${goal.current_amount:,.2f} / ${goal.target_amount:,.2f}.",
            notification_type=NotificationType.SYSTEM.value
        )

    db.commit()
    db.refresh(goal)
    return build_savings_response(goal)

@router.put("/{goal_id}", response_model=SavingsGoalOut)
def update_savings_goal(
    goal_id: int,
    goal_in: SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")

    update_data = goal_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    if goal.current_amount >= goal.target_amount:
        goal.is_completed = True

    db.commit()
    db.refresh(goal)
    return build_savings_response(goal)

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_savings_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")

    title = goal.title

    db.delete(goal)
    db.commit()

    create_notification(
        db=db,
        user_id=current_user.id,
        title="🗑️ Savings Goal Removed",
        message=f"Savings goal '{title}' was removed.",
        notification_type=NotificationType.SYSTEM.value
    )

    return None
