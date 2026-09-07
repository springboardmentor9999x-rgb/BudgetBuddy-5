from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from datetime import date

from app.database import get_db
from app.users import get_current_user

from app.models import (
    BankAccount,
    User,
    Income,
    Expense,
    SavingsTransaction,
    SavingsGoal,
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

    # -----------------------------------------
    # AUTOMATIC OPENING BALANCE INCOME
    # -----------------------------------------

    if (
        new_bank.current_balance is not None
        and new_bank.current_balance > 0
    ):

        opening_income = Income(
            user_id=current_user.id,
            source="Bank Account Opening Balance",
            category="Opening Balance",
            amount=new_bank.current_balance,
            description=(
                f"Initial balance added when "
                f"{new_bank.bank_name} account was created"
            ),
            date=date.today(),
            bank_account_id=new_bank.id,
        )

        db.add(opening_income)

        db.commit()

    return new_bank


# ==================================================
# FIX EXISTING BANK OPENING BALANCES
# ==================================================
#
# ONE-TIME USE
#
# This calculates the original opening balance
# from existing transactions.
#
# Formula:
#
# Opening Balance =
# Current Balance
# - Existing Income
# + Existing Expenses
# + Existing Savings
#
# It does NOT modify:
# - Current bank balance
# - Existing income
# - Existing expenses
# - Existing savings
#
# It only creates the missing Opening Balance
# Income record.
# ==================================================

@router.post("/fix-existing-opening-balances")
def fix_existing_opening_balances(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    banks = (
        db.query(BankAccount)
        .filter(
            BankAccount.user_id == current_user.id
        )
        .all()
    )

    if not banks:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No bank accounts found"
        )

    results = []

    for bank in banks:

        # -----------------------------------------
        # CHECK IF OPENING BALANCE ALREADY EXISTS
        # -----------------------------------------

        existing_opening = (
            db.query(Income)
            .filter(
                Income.user_id == current_user.id,
                Income.bank_account_id == bank.id,
                Income.source == "Bank Account Opening Balance",
                Income.category == "Opening Balance"
            )
            .first()
        )

        if existing_opening is not None:

            results.append({
                "bank_id": bank.id,
                "bank_name": bank.bank_name,
                "status": "Already exists",
                "opening_balance": float(
                    existing_opening.amount
                )
            })

            continue

        # -----------------------------------------
        # TOTAL NORMAL INCOME
        # -----------------------------------------

        income_total = (
            db.query(
                func.coalesce(
                    func.sum(Income.amount),
                    0
                )
            )
            .filter(
                Income.user_id == current_user.id,
                Income.bank_account_id == bank.id,
                Income.source != "Bank Account Opening Balance",
                Income.category != "Opening Balance"
            )
            .scalar()
        )

        # -----------------------------------------
        # TOTAL EXPENSE
        # -----------------------------------------

        expense_total = (
            db.query(
                func.coalesce(
                    func.sum(Expense.amount),
                    0
                )
            )
            .filter(
                Expense.user_id == current_user.id,
                Expense.bank_account_id == bank.id
            )
            .scalar()
        )

        # -----------------------------------------
        # TOTAL SAVINGS
        # -----------------------------------------

        savings_total = (
            db.query(
                func.coalesce(
                    func.sum(SavingsTransaction.amount),
                    0
                )
            )
            .filter(
                SavingsTransaction.user_id == current_user.id,
                SavingsTransaction.bank_account_id == bank.id
            )
            .scalar()
        )

        # -----------------------------------------
        # CALCULATE OPENING BALANCE
        # -----------------------------------------

        current_balance = float(
            bank.current_balance or 0
        )

        income_total = float(
            income_total or 0
        )

        expense_total = float(
            expense_total or 0
        )

        savings_total = float(
            savings_total or 0
        )

        opening_balance = (
            current_balance
            - income_total
            + expense_total
            + savings_total
        )

        # -----------------------------------------
        # VALIDATION
        # -----------------------------------------

        if opening_balance < 0:

            results.append({
                "bank_id": bank.id,
                "bank_name": bank.bank_name,
                "status": "Skipped",
                "message": (
                    "Calculated opening balance is negative. "
                    "Please check existing transactions."
                ),
                "calculated_opening_balance": round(
                    opening_balance,
                    2
                )
            })

            continue

        # -----------------------------------------
        # CREATE OPENING BALANCE INCOME
        # -----------------------------------------

        opening_income = Income(
            user_id=current_user.id,
            source="Bank Account Opening Balance",
            category="Opening Balance",
            amount=opening_balance,
            description=(
                f"Original opening balance for "
                f"{bank.bank_name} based on existing "
                f"transactions"
            ),
            date=date.today(),
            bank_account_id=bank.id,
        )

        db.add(opening_income)

        results.append({
            "bank_id": bank.id,
            "bank_name": bank.bank_name,
            "status": "Created",
            "opening_balance": round(
                opening_balance,
                2
            ),
            "current_balance": round(
                current_balance,
                2
            ),
            "existing_income": round(
                income_total,
                2
            ),
            "existing_expenses": round(
                expense_total,
                2
            ),
            "existing_savings": round(
                savings_total,
                2
            )
        })

    # -----------------------------------------
    # SAVE ALL CHANGES
    # -----------------------------------------

    db.commit()

    return {
        "message": (
            "Existing bank opening balances "
            "processed successfully."
        ),
        "results": results
    }


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
    # GET SAVINGS TRANSACTIONS FOR THIS BANK
    # -----------------------------------------

    savings_transactions = (
        db.query(
            SavingsTransaction,
            SavingsGoal.goal_name
        )
        .join(
            SavingsGoal,
            SavingsTransaction.goal_id == SavingsGoal.id
        )
        .filter(
            SavingsTransaction.user_id == current_user.id,
            SavingsTransaction.bank_account_id == bank_id
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
    # ADD SAVINGS TRANSACTIONS
    # -----------------------------------------

    for savings_transaction, goal_name in savings_transactions:

        transactions.append({
            "id": savings_transaction.id,
            "type": "Savings",
            "category": "Savings Goal",
            "source": goal_name,
            "amount": savings_transaction.amount,
            "description": (
                f"Added to savings goal: {goal_name}"
            ),
            "date": savings_transaction.transaction_date,
        })

    # -----------------------------------------
    # SORT BY DATE
    # -----------------------------------------

    transactions.sort(
        key=lambda transaction: transaction["date"],
        reverse=True
    )

    # -----------------------------------------
    # CALCULATE BANK TRANSACTION TOTALS
    # -----------------------------------------

    total_income = sum(
        float(transaction["amount"] or 0)
        for transaction in transactions
        if transaction["type"] == "Income"
    )

    total_expense = sum(
        float(transaction["amount"] or 0)
        for transaction in transactions
        if transaction["type"] == "Expense"
    )

    total_savings = sum(
        float(transaction["amount"] or 0)
        for transaction in transactions
        if transaction["type"] == "Savings"
    )

    total_spent = total_expense + total_savings

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
        "summary": {
            "total_income": total_income,
            "total_expense": total_expense,
            "total_savings": total_savings,
            "total_spent": total_spent,
            "transaction_count": len(transactions),
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

    # -----------------------------------------
    # SET PRIMARY ACCOUNT
    # -----------------------------------------

    if bank_data.is_primary:

        db.query(BankAccount).filter(
            BankAccount.user_id == current_user.id,
            BankAccount.id != bank_id
        ).update(
            {
                "is_primary": False
            }
        )

    # -----------------------------------------
    # UPDATE BANK DETAILS
    # -----------------------------------------

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