from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.users import get_current_user
from sqlalchemy.exc import IntegrityError
from app.models import (
    BankAccount,
    User,
    Income,
    Expense,
)
from app.schemas import (
    BankAccountCreate,
    BankAccountUpdate,
    BankAccountResponse,
)

router = APIRouter(
    prefix="/banks",
    tags=["Bank Accounts"]
)

# ==================================================
# TOTAL BANK BALANCE
# ==================================================

@router.get("/total-balance")
def total_bank_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total = (
        db.query(func.sum(BankAccount.current_balance))
        .filter(
            BankAccount.user_id == current_user.id
        )
        .scalar()
    )

    return {
        "total_balance": total or 0
    }

# ==================================================
# CREATE BANK ACCOUNT
# ==================================================

@router.post(
    "",
    response_model=BankAccountResponse,
    status_code=status.HTTP_201_CREATED
)
def create_bank_account(
    bank_data: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # -----------------------------------------
    # CHECK DUPLICATE BANK
    # -----------------------------------------

    existing_bank = (
        db.query(BankAccount)
        .filter(
            BankAccount.user_id == current_user.id,
            func.lower(
                func.trim(BankAccount.bank_name)
            )
            ==
            func.lower(
                func.trim(bank_data.bank_name)
            )
        )
        .first()
    )

    if existing_bank is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "You already have a bank account "
                "for this bank"
            )
        )

    # -----------------------------------------
    # SET PRIMARY ACCOUNT
    # -----------------------------------------

    if bank_data.is_primary:

        db.query(BankAccount).filter(
            BankAccount.user_id == current_user.id
        ).update(
            {
                "is_primary": False
            }
        )

    # -----------------------------------------
    # CREATE BANK ACCOUNT
    # -----------------------------------------

    new_bank = BankAccount(
        user_id=current_user.id,
        bank_name=bank_data.bank_name,
        account_holder=bank_data.account_holder,
        account_number=bank_data.account_number,
        ifsc_code=bank_data.ifsc_code,
        account_type=bank_data.account_type,
        current_balance=bank_data.current_balance,
        is_primary=bank_data.is_primary,
    )

    db.add(new_bank)

    # -----------------------------------------
    # DATABASE SAFETY CHECK
    # -----------------------------------------

    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "You already have a bank account "
                "for this bank"
            )
        )

    db.refresh(new_bank)

    return new_bank


# ==================================================
# GET ALL BANK ACCOUNTS
# ==================================================

@router.get(
    "",
    response_model=list[BankAccountResponse]
)
def get_bank_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return (
        db.query(BankAccount)
        .filter(
            BankAccount.user_id == current_user.id
        )
        .order_by(
            BankAccount.is_primary.desc(),
            BankAccount.id.desc()
        )
        .all()
    )

# ==================================================
# GET BANK TRANSACTIONS
# ==================================================

@router.get("/{bank_id}/transactions")
def get_bank_transactions(
    bank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # -----------------------------------------
    # CHECK BANK BELONGS TO CURRENT USER
    # -----------------------------------------

    bank = (
        db.query(BankAccount)
        .filter(
            BankAccount.id == bank_id,
            BankAccount.user_id == current_user.id
        )
        .first()
    )

    if bank is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank account not found"
        )

    # -----------------------------------------
    # GET INCOME FOR THIS BANK
    # -----------------------------------------

    income_transactions = (
        db.query(Income)
        .filter(
            Income.user_id == current_user.id,
            Income.bank_account_id == bank_id
        )
        .all()
    )

    # -----------------------------------------
    # GET EXPENSES FOR THIS BANK
    # -----------------------------------------

    expense_transactions = (
        db.query(Expense)
        .filter(
            Expense.user_id == current_user.id,
            Expense.bank_account_id == bank_id
        )
        .all()
    )

    # -----------------------------------------
    # COMBINE TRANSACTIONS
    # -----------------------------------------

    transactions = []

    for income in income_transactions:

        transactions.append({
            "id": income.id,
            "type": "Income",
            "category": income.category,
            "source": income.source,
            "amount": income.amount,
            "description": income.description,
            "date": income.date,
        })

    for expense in expense_transactions:

        transactions.append({
            "id": expense.id,
            "type": "Expense",
            "category": expense.category,
            "payment_method": expense.payment_method,
            "amount": expense.amount,
            "description": expense.description,
            "date": expense.date,
        })

    # -----------------------------------------
    # SORT BY DATE
    # -----------------------------------------

    transactions.sort(
        key=lambda transaction: transaction["date"],
        reverse=True
    )

    # -----------------------------------------
    # RETURN
    # -----------------------------------------

    return {
        "bank": {
            "id": bank.id,
            "bank_name": bank.bank_name,
            "account_number": bank.account_number,
            "current_balance": bank.current_balance,
            "is_primary": bank.is_primary,
        },
        "transactions": transactions,
    }

# ==================================================
# GET ONE BANK ACCOUNT
# ==================================================

@router.get(
    "/{bank_id}",
    response_model=BankAccountResponse
)
def get_bank_account(
    bank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    bank = (
        db.query(BankAccount)
        .filter(
            BankAccount.id == bank_id,
            BankAccount.user_id == current_user.id
        )
        .first()
    )

    if bank is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank account not found"
        )

    return bank


# ==================================================
# UPDATE BANK ACCOUNT
# ==================================================

@router.put(
    "/{bank_id}",
    response_model=BankAccountResponse
)
def update_bank_account(
    bank_id: int,
    bank_data: BankAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    bank = (
        db.query(BankAccount)
        .filter(
            BankAccount.id == bank_id,
            BankAccount.user_id == current_user.id
        )
        .first()
    )

    if bank is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank account not found"
        )

    if bank_data.is_primary:
        db.query(BankAccount).filter(
            BankAccount.user_id == current_user.id,
            BankAccount.id != bank_id
        ).update(
            {"is_primary": False}
        )

    bank.bank_name = bank_data.bank_name
    bank.account_holder = bank_data.account_holder
    bank.account_number = bank_data.account_number
    bank.ifsc_code = bank_data.ifsc_code
    bank.account_type = bank_data.account_type
    bank.current_balance = bank_data.current_balance
    bank.is_primary = bank_data.is_primary

    db.commit()
    db.refresh(bank)

    return bank


# ==================================================
# DELETE BANK ACCOUNT
# ==================================================

@router.delete(
    "/{bank_id}"
)
def delete_bank_account(
    bank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    bank = (
        db.query(BankAccount)
        .filter(
            BankAccount.id == bank_id,
            BankAccount.user_id == current_user.id
        )
        .first()
    )

    if bank is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank account not found"
        )

    db.delete(bank)
    db.commit()

    return {
        "message": "Bank account deleted successfully"
    }

