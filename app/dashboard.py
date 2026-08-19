from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import (
    Income,
    Expense,
    SavingsTransaction,
    SavingsGoal,
    User
)
from app.users import get_current_user


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# ==================================================
# DASHBOARD SUMMARY
# ==================================================

@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Total Income
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


    # Total Expense
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


    # Total amount moved into Savings Goals
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


    # Available money
    #
    # Income - Expenses - Money moved to Savings
    available_balance = (
        float(total_income)
        - float(total_expense)
        - float(total_savings)
    )


    return {
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "total_savings": float(total_savings),
        "available_balance": available_balance
    }


# ==================================================
# RECENT TRANSACTIONS
# ==================================================

@router.get("/recent-transactions")
def recent_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Create transaction list first
    transactions = []


    # ==================================================
    # INCOME TRANSACTIONS
    # ==================================================

    income_records = (
        db.query(Income)
        .filter(
            Income.user_id == current_user.id
        )
        .all()
    )

    for item in income_records:

        transactions.append({
            "id": f"income-{item.id}",
            "date": item.date,
            "description": item.source,
            "type": "Income",
            "amount": float(item.amount),
        })


    # ==================================================
    # EXPENSE TRANSACTIONS
    # ==================================================

    expense_records = (
        db.query(Expense)
        .filter(
            Expense.user_id == current_user.id
        )
        .all()
    )

    for item in expense_records:

        transactions.append({
            "id": f"expense-{item.id}",
            "date": item.date,
            "description": item.description or item.category,
            "type": "Expense",
            "amount": float(item.amount),
        })


    # ==================================================
    # SAVINGS TRANSACTIONS
    # ==================================================

    savings_transactions = (
        db.query(
            SavingsTransaction,
            SavingsGoal.goal_name
        )
        .join(
            SavingsGoal,
            SavingsGoal.id == SavingsTransaction.goal_id
        )
        .filter(
            SavingsTransaction.user_id == current_user.id
        )
        .all()
    )

    for transaction, goal_name in savings_transactions:

        transactions.append({
            "id": f"savings-{transaction.id}",
            "date": transaction.transaction_date,
            "description": (
                f"Added to savings goal: {goal_name}"
            ),
            "type": "Savings",
            "amount": float(transaction.amount),
        })


    # ==================================================
    # SORT BY DATE
    # ==================================================

    transactions.sort(
        key=lambda x: x["date"],
        reverse=True
    )


    return transactions[:10]