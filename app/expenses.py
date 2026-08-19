from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Expense, User, BankAccount
from app.users import get_current_user
from app.schemas import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
)

router = APIRouter(
    prefix="/expenses",
    tags=["Expenses"]
)


# ==================================================
# CREATE EXPENSE
# ==================================================

@router.post(
    "",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED
)
def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bank = None

    # Check selected bank
    if expense.bank_account_id is not None:

        bank = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == expense.bank_account_id,
                BankAccount.user_id == current_user.id
            )
            .first()
        )

        if bank is None:
            raise HTTPException(
                status_code=404,
                detail="Bank account not found"
            )

    # Create expense
    new_expense = Expense(
        user_id=current_user.id,
        category=expense.category,
        payment_method=expense.payment_method,
        amount=expense.amount,
        description=expense.description,
        date=expense.date,
        bank_account_id=expense.bank_account_id,
    )

    db.add(new_expense)

    # Subtract expense from bank balance
    if bank is not None:

        if bank.current_balance < expense.amount:
            raise HTTPException(
                status_code=400,
                detail="Insufficient bank balance"
            )

        bank.current_balance -= expense.amount

    db.commit()
    db.refresh(new_expense)

    return new_expense


# ==================================================
# GET ALL EXPENSES
# ==================================================

@router.get(
    "",
    response_model=list[ExpenseResponse]
)
def get_all_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return (
        db.query(Expense)
        .filter(
            Expense.user_id == current_user.id
        )
        .order_by(
            Expense.date.desc()
        )
        .all()
    )
# ==================================================
# TOTAL EXPENSE
# ==================================================

@router.get("/total")
def total_expense(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == current_user.id
        )
        .scalar()
    )

    return {
        "total_expense": total or 0
    }

# ==================================================
# GET SINGLE EXPENSE
# ==================================================

@router.get(
    "/{expense_id}",
    response_model=ExpenseResponse
)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    expense = (
        db.query(Expense)
        .filter(
            Expense.id == expense_id,
            Expense.user_id == current_user.id
        )
        .first()
    )

    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )

    return expense


# ==================================================
# UPDATE EXPENSE
# ==================================================

@router.put(
    "/{expense_id}",
    response_model=ExpenseResponse
)
def update_expense(
    expense_id: int,
    expense_data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find existing expense
    expense = (
        db.query(Expense)
        .filter(
            Expense.id == expense_id,
            Expense.user_id == current_user.id
        )
        .first()
    )

    if expense is None:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    # -----------------------------------------
    # OLD BANK
    # -----------------------------------------

    old_bank = None

    if expense.bank_account_id is not None:
        old_bank = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == expense.bank_account_id,
                BankAccount.user_id == current_user.id
            )
            .first()
        )

    # -----------------------------------------
    # NEW BANK
    # -----------------------------------------

    new_bank = None

    if expense_data.bank_account_id is not None:
        new_bank = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == expense_data.bank_account_id,
                BankAccount.user_id == current_user.id
            )
            .first()
        )

        if new_bank is None:
            raise HTTPException(
                status_code=404,
                detail="New bank account not found"
            )

    # -----------------------------------------
    # RESTORE OLD EXPENSE
    # -----------------------------------------
    # Put the old amount back into the old bank.

    if old_bank is not None:
        old_bank.current_balance += expense.amount

    # -----------------------------------------
    # CHECK NEW BANK BALANCE
    # -----------------------------------------

    if new_bank is not None:

        if new_bank.current_balance < expense_data.amount:
            # Undo restoration of old bank
            if old_bank is not None:
                old_bank.current_balance -= expense.amount

            raise HTTPException(
                status_code=400,
                detail="Insufficient bank balance"
            )

    # -----------------------------------------
    # UPDATE EXPENSE
    # -----------------------------------------

    expense.category = expense_data.category
    expense.payment_method = expense_data.payment_method
    expense.amount = expense_data.amount
    expense.description = expense_data.description
    expense.date = expense_data.date
    expense.bank_account_id = (
        expense_data.bank_account_id
    )

    # -----------------------------------------
    # SUBTRACT NEW AMOUNT
    # -----------------------------------------

    if new_bank is not None:
        new_bank.current_balance -= (
            expense_data.amount
        )

    db.commit()
    db.refresh(expense)

    return expense


# ==================================================
# DELETE EXPENSE
# ==================================================

@router.delete(
    "/{expense_id}"
)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find expense
    expense = (
        db.query(Expense)
        .filter(
            Expense.id == expense_id,
            Expense.user_id == current_user.id
        )
        .first()
    )

    if expense is None:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    # -----------------------------------------
    # RESTORE MONEY TO BANK
    # -----------------------------------------

    if expense.bank_account_id is not None:

        bank = (
            db.query(BankAccount)
            .filter(
                BankAccount.id ==
                expense.bank_account_id,
                BankAccount.user_id ==
                current_user.id
            )
            .first()
        )

        if bank is not None:
            bank.current_balance += expense.amount

    # -----------------------------------------
    # DELETE EXPENSE
    # -----------------------------------------

    db.delete(expense)

    db.commit()

    return {
        "message": "Expense deleted successfully"
    }


# ==================================================
# TOTAL EXPENSE
# ==================================================

@router.get("/total")
def total_expense(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    total = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == current_user.id
        )
        .scalar()
    )

    return {
        "total_expense": total or 0
    }