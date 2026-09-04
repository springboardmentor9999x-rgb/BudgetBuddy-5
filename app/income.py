from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.notification_service import create_notification
from app.database import get_db
from app.models import Income, User, BankAccount
from app.users import require_user

from app.schemas import (
    IncomeCreate,
    IncomeUpdate,
    IncomeResponse,
)


router = APIRouter(
    prefix="/income",
    tags=["Income"]
)


# ==================================================
# CREATE INCOME
# ==================================================

@router.post(
    "",
    response_model=IncomeResponse,
    status_code=status.HTTP_201_CREATED
)
def create_income(
    income: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):

    # -----------------------------------------
    # Check bank account if one was selected
    # -----------------------------------------

    bank = None

    if income.bank_account_id is not None:

        bank = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == income.bank_account_id,
                BankAccount.user_id == current_user.id
            )
            .first()
        )

        if bank is None:
            raise HTTPException(
                status_code=404,
                detail="Bank account not found"
            )

    # -----------------------------------------
    # Create income
    # -----------------------------------------

    new_income = Income(
        user_id=current_user.id,
        source=income.source,
        category=income.category,
        amount=income.amount,
        description=income.description,
        date=income.date,
        bank_account_id=income.bank_account_id,
    )

    db.add(new_income)

    # -----------------------------------------
    # Add income notification
    # -----------------------------------------

    create_notification(
        db=db,
        user_id=current_user.id,
        message=f"Income of ₹{income.amount} added successfully.",
        notification_type="income"
    )

    # -----------------------------------------
    # Add income amount to bank balance
    # -----------------------------------------

    if bank is not None:
        bank.current_balance += income.amount

    db.commit()
    db.refresh(new_income)

    return new_income


# ==================================================
# GET ALL INCOME
# ==================================================

@router.get(
    "",
    response_model=list[IncomeResponse]
)
def get_all_income(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):

    return (
        db.query(Income)
        .filter(
            Income.user_id == current_user.id
        )
        .order_by(
            Income.date.desc()
        )
        .all()
    )


# ==================================================
# TOTAL INCOME
# ==================================================

@router.get("/total")
def total_income(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):

    total = (
        db.query(
            func.sum(Income.amount)
        )
        .filter(
            Income.user_id == current_user.id
        )
        .scalar()
    )

    return {
        "total_income": total or 0
    }


# ==================================================
# GET SINGLE INCOME
# ==================================================

@router.get(
    "/{income_id}",
    response_model=IncomeResponse
)
def get_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):

    income = (
        db.query(Income)
        .filter(
            Income.id == income_id,
            Income.user_id == current_user.id
        )
        .first()
    )

    if income is None:
        raise HTTPException(
            status_code=404,
            detail="Income not found"
        )

    return income


# ==================================================
# UPDATE INCOME
# ==================================================

@router.put(
    "/{income_id}",
    response_model=IncomeResponse
)
def update_income(
    income_id: int,
    income: IncomeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):

    # -----------------------------------------
    # Find existing income
    # -----------------------------------------

    db_income = (
        db.query(Income)
        .filter(
            Income.id == income_id,
            Income.user_id == current_user.id
        )
        .first()
    )

    if db_income is None:
        raise HTTPException(
            status_code=404,
            detail="Income not found"
        )

    # -----------------------------------------
    # OLD BANK
    # -----------------------------------------

    old_bank = None

    if db_income.bank_account_id is not None:

        old_bank = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == db_income.bank_account_id,
                BankAccount.user_id == current_user.id
            )
            .first()
        )

    # -----------------------------------------
    # NEW BANK
    # -----------------------------------------

    new_bank = None

    if income.bank_account_id is not None:

        new_bank = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == income.bank_account_id,
                BankAccount.user_id == current_user.id
            )
            .first()
        )

        if new_bank is None:
            raise HTTPException(
                status_code=404,
                detail="Bank account not found"
            )

    # -----------------------------------------
    # REMOVE OLD INCOME FROM OLD BANK
    # -----------------------------------------

    if old_bank is not None:
        old_bank.current_balance -= db_income.amount

    # -----------------------------------------
    # ADD NEW INCOME TO NEW BANK
    # -----------------------------------------

    if new_bank is not None:
        new_bank.current_balance += income.amount

    # -----------------------------------------
    # UPDATE INCOME
    # -----------------------------------------

    db_income.source = income.source
    db_income.category = income.category
    db_income.amount = income.amount
    db_income.description = income.description
    db_income.date = income.date
    db_income.bank_account_id = income.bank_account_id

    db.commit()
    db.refresh(db_income)

    return db_income


# ==================================================
# DELETE INCOME
# ==================================================

@router.delete(
    "/{income_id}"
)
def delete_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):

    # -----------------------------------------
    # Find income
    # -----------------------------------------

    db_income = (
        db.query(Income)
        .filter(
            Income.id == income_id,
            Income.user_id == current_user.id
        )
        .first()
    )

    if db_income is None:
        raise HTTPException(
            status_code=404,
            detail="Income not found"
        )

    # -----------------------------------------
    # Remove money from bank
    # -----------------------------------------

    if db_income.bank_account_id is not None:

        bank = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == db_income.bank_account_id,
                BankAccount.user_id == current_user.id
            )
            .first()
        )

        if bank is not None:
            bank.current_balance -= db_income.amount

    # -----------------------------------------
    # Delete income
    # -----------------------------------------

    db.delete(db_income)

    db.commit()

    return {
        "message": "Income deleted successfully"
    }


# ==================================================
# SEARCH INCOME
# ==================================================

@router.get(
    "/search/{keyword}",
    response_model=list[IncomeResponse]
)
def search_income(
    keyword: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):

    return (
        db.query(Income)
        .filter(
            Income.user_id == current_user.id,
            Income.source.ilike(
                f"%{keyword}%"
            )
        )
        .all()
    )