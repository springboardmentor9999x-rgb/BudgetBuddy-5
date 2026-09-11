from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, Income, BankAccount, NotificationType
from app.schemas.schemas import IncomeCreate, IncomeUpdate, IncomeOut
from app.services.notification_service import create_notification

router = APIRouter()

@router.get("/", response_model=List[IncomeOut])
def get_incomes(
    category: Optional[str] = None,
    month: Optional[str] = None, # YYYY-MM
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Income).filter(Income.user_id == current_user.id)
    if category:
        query = query.filter(Income.category == category)
    if month:
        query = query.filter(Income.date.like(f"{month}%"))

    return query.order_by(Income.date.desc()).all()

@router.post("/", response_model=IncomeOut, status_code=status.HTTP_201_CREATED)
def create_income(
    income_in: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    income = Income(
        user_id=current_user.id,
        bank_account_id=income_in.bank_account_id,
        title=income_in.title,
        amount=income_in.amount,
        category=income_in.category,
        date=income_in.date,
        description=income_in.description
    )
    db.add(income)

    # Add amount to linked BankAccount balance
    if income_in.bank_account_id:
        bank = db.query(BankAccount).filter(BankAccount.id == income_in.bank_account_id, BankAccount.user_id == current_user.id).first()
        if bank:
            bank.current_balance += income_in.amount

    db.commit()
    db.refresh(income)

    create_notification(
        db=db,
        user_id=current_user.id,
        title="💵 Income Logged",
        message=f"Income '{income.title}' (${income.amount:,.2f}) added to {income.category}.",
        notification_type=NotificationType.SYSTEM.value
    )

    return income

@router.put("/{income_id}", response_model=IncomeOut)
def update_income(
    income_id: int,
    income_in: IncomeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    income = db.query(Income).filter(Income.id == income_id, Income.user_id == current_user.id).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income entry not found")

    update_data = income_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(income, field, value)

    db.commit()
    db.refresh(income)

    create_notification(
        db=db,
        user_id=current_user.id,
        title="✏️ Income Updated",
        message=f"Income '{income.title}' updated to ${income.amount:,.2f}.",
        notification_type=NotificationType.SYSTEM.value
    )

    return income

@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    income = db.query(Income).filter(Income.id == income_id, Income.user_id == current_user.id).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income entry not found")

    title = income.title
    amount = income.amount

    db.delete(income)
    db.commit()

    create_notification(
        db=db,
        user_id=current_user.id,
        title="🗑️ Income Deleted",
        message=f"Income '{title}' (${amount:,.2f}) was removed.",
        notification_type=NotificationType.SYSTEM.value
    )

    return None
