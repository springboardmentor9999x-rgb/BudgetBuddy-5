from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.database import get_db
from app.models import (
    User,
    Income,
    Expense,
    BankAccount,
    Budget,
    SavingsGoal,
    SavingsTransaction,
)
from app.users import require_premium


router = APIRouter(
    prefix="/analytics",
    tags=["System Analytics"]
)


# ==========================================================
# HELPER
# ==========================================================

def is_admin(user: User) -> bool:
    return user.role == "admin"


# ==========================================================
# SYSTEM ANALYTICS SUMMARY
#
# PREMIUM:
#   Only their own data
#
# ADMIN:
#   All users' data
# ==========================================================

@router.get("/system")
def system_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium)
):
    """
    Personal System Analytics.

    Premium users and the administrator both see ONLY
    their own financial data.
    """

    user_id = current_user.id

    total_income = (
        db.query(
            func.coalesce(
                func.sum(Income.amount),
                0
            )
        )
        .filter(
            Income.user_id == user_id
        )
        .scalar()
    )

    total_expenses = (
        db.query(
            func.coalesce(
                func.sum(Expense.amount),
                0
            )
        )
        .filter(
            Expense.user_id == user_id
        )
        .scalar()
    )

    total_savings = (
        db.query(
            func.coalesce(
                func.sum(SavingsTransaction.amount),
                0
            )
        )
        .filter(
            SavingsTransaction.user_id == user_id
        )
        .scalar()
    )

    total_bank_accounts = (
        db.query(BankAccount)
        .filter(
            BankAccount.user_id == user_id
        )
        .count()
    )

    total_budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == user_id
        )
        .count()
    )

    total_savings_goals = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == user_id
        )
        .count()
    )

    total_income_records = (
        db.query(Income)
        .filter(
            Income.user_id == user_id
        )
        .count()
    )

    total_expense_records = (
        db.query(Expense)
        .filter(
            Expense.user_id == user_id
        )
        .count()
    )

    total_savings_transactions = (
        db.query(SavingsTransaction)
        .filter(
            SavingsTransaction.user_id == user_id
        )
        .count()
    )

    net_balance = (
        float(total_income or 0)
        - float(total_expenses or 0)
    )

    if current_user.role == "admin":
        user_summary = {
            "total": 1,
            "normal": 0,
            "premium": 0,
            "admin": 1,
        }
    else:
        user_summary = {
            "total": 1,
            "normal": 0,
            "premium": 1,
            "admin": 0,
        }

    return {
        "scope": "personal",

        "users": user_summary,

        "financial": {
            "total_income": float(
                total_income or 0
            ),
            "total_expenses": float(
                total_expenses or 0
            ),
            "total_savings": float(
                total_savings or 0
            ),
            "net_balance": net_balance,
        },

        "system": {
            "bank_accounts": total_bank_accounts,
            "budgets": total_budgets,
            "savings_goals": total_savings_goals,
            "income_records": total_income_records,
            "expense_records": total_expense_records,
            "savings_transactions":
                total_savings_transactions,
        }
    }


# ==========================================================
# MONTHLY INCOME VS EXPENSES
#
# PREMIUM:
#   Own monthly data
#
# ADMIN:
#   System-wide monthly data
# ==========================================================

@router.get("/monthly")
def monthly_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium)
):
    """
    Personal monthly income vs expense analytics.

    Premium users and the administrator both see ONLY
    their own monthly data.
    """

    user_id = current_user.id

    income_query = (
        db.query(
            extract(
                "year",
                Income.date
            ).label("year"),

            extract(
                "month",
                Income.date
            ).label("month"),

            func.sum(
                Income.amount
            ).label("total")
        )
        .filter(
            Income.user_id == user_id
        )
    )

    expense_query = (
        db.query(
            extract(
                "year",
                Expense.date
            ).label("year"),

            extract(
                "month",
                Expense.date
            ).label("month"),

            func.sum(
                Expense.amount
            ).label("total")
        )
        .filter(
            Expense.user_id == user_id
        )
    )

    income_rows = (
        income_query
        .group_by(
            extract(
                "year",
                Income.date
            ),

            extract(
                "month",
                Income.date
            )
        )
        .order_by(
            extract(
                "year",
                Income.date
            ),

            extract(
                "month",
                Income.date
            )
        )
        .all()
    )

    expense_rows = (
        expense_query
        .group_by(
            extract(
                "year",
                Expense.date
            ),

            extract(
                "month",
                Expense.date
            )
        )
        .order_by(
            extract(
                "year",
                Expense.date
            ),

            extract(
                "month",
                Expense.date
            )
        )
        .all()
    )

    monthly_data = {}

    for row in income_rows:
        key = (
            f"{int(row.year)}-"
            f"{int(row.month):02d}"
        )

        monthly_data[key] = {
            "month": key,
            "income": float(
                row.total or 0
            ),
            "expenses": 0,
        }

    for row in expense_rows:
        key = (
            f"{int(row.year)}-"
            f"{int(row.month):02d}"
        )

        if key not in monthly_data:
            monthly_data[key] = {
                "month": key,
                "income": 0,
                "expenses": 0,
            }

        monthly_data[key]["expenses"] = float(
            row.total or 0
        )

    for month in monthly_data.values():
        month["balance"] = (
            month["income"]
            - month["expenses"]
        )

    return sorted(
        monthly_data.values(),
        key=lambda x: x["month"]
    )


# ==========================================================
# EXPENSE CATEGORY ANALYTICS
#
# PREMIUM:
#   Own expenses only
#
# ADMIN:
#   All users' expenses
# ==========================================================

@router.get("/expense-categories")
def expense_category_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium)
):

    query = (
        db.query(
            Expense.category,
            func.sum(
                Expense.amount
            ).label("total")
        )
    )

    # Both premium users and the administrator see
    # only their own expense categories.

    query = query.filter(
        Expense.user_id == current_user.id
    )

    rows = (
        query
        .group_by(
            Expense.category
        )
        .order_by(
            func.sum(
                Expense.amount
            ).desc()
        )
        .all()
    )

    return [
        {
            "category": row.category,
            "amount": float(
                row.total or 0
            )
        }
        for row in rows
    ]


# ==========================================================
# USER ANALYTICS
#
# PREMIUM:
#   Only their own account
#
# ADMIN:
#   Entire system
# ==========================================================

@router.get("/users")
def user_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium)
):
    """
    Personal user analytics.

    Premium users and the administrator both see
    only their own account scope.
    """

    if current_user.role == "admin":
        return {
            "scope": "personal",
            "total": 1,
            "normal": 0,
            "premium": 0,
            "admin": 1,
        }

    return {
        "scope": "personal",
        "total": 1,
        "normal": 0,
        "premium": 1,
        "admin": 0,
    }
