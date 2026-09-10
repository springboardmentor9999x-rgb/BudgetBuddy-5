from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    BankAccount,
    Budget,
    Expense,
    Income,
    SavingsGoal,
    SavingsTransaction,
    User,
)
from app.users import get_current_user


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# ============================================================
# DATE RANGE HELPER
# ============================================================

def _date_range(month: int | None, year: int | None):
    """
    Returns the start and end date for the selected month.

    If both month and year are None, all-time data is returned.
    """

    if month is None and year is None:
        return None, None

    today = date.today()

    month = today.month if month is None else month
    year = today.year if year is None else year

    if month < 1 or month > 12:
        raise ValueError("Month must be between 1 and 12")

    if year < 2000 or year > 2100:
        raise ValueError("Invalid year")

    start_date = date(year, month, 1)

    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    return start_date, end_date


# ============================================================
# DASHBOARD SUMMARY
# ============================================================

@router.get("/summary")
def dashboard_summary(
    month: int | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    try:
        start_date, end_date = _date_range(month, year)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    # --------------------------------------------------------
    # INCOME
    # --------------------------------------------------------

    income_query = (
        db.query(
            func.coalesce(
                func.sum(Income.amount),
                0
            )
        )
        .filter(
            Income.user_id == current_user.id
        )
    )

    # --------------------------------------------------------
    # EXPENSE
    # --------------------------------------------------------

    expense_query = (
        db.query(
            func.coalesce(
                func.sum(Expense.amount),
                0
            )
        )
        .filter(
            Expense.user_id == current_user.id
        )
    )

    # --------------------------------------------------------
    # SAVINGS
    # --------------------------------------------------------

    savings_query = (
        db.query(
            func.coalesce(
                func.sum(SavingsTransaction.amount),
                0
            )
        )
        .filter(
            SavingsTransaction.user_id == current_user.id
        )
    )

    # --------------------------------------------------------
    # APPLY MONTH FILTER
    # --------------------------------------------------------

    if start_date:

        income_query = income_query.filter(
            Income.date >= start_date,
            Income.date < end_date
        )

        expense_query = expense_query.filter(
            Expense.date >= start_date,
            Expense.date < end_date
        )

        savings_query = savings_query.filter(
            SavingsTransaction.transaction_date >= start_date,
            SavingsTransaction.transaction_date < end_date
        )

    total_income = float(
        income_query.scalar() or 0
    )

    total_expense = float(
        expense_query.scalar() or 0
    )

    total_savings = float(
        savings_query.scalar() or 0
    )

    # --------------------------------------------------------
    # ACTUAL BANK BALANCE
    # --------------------------------------------------------

    total_balance = float(
        db.query(
            func.coalesce(
                func.sum(BankAccount.current_balance),
                0
            )
        )
        .filter(
            BankAccount.user_id == current_user.id
        )
        .scalar()
        or 0
    )

    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return {
        "total_balance": total_balance,

        "total_income": total_income,

        "total_expense": total_expense,

        "total_savings": total_savings,

        "available_balance":
            total_income
            - total_expense
            - total_savings,

        "period": {
            "month": month,
            "year": year
        }
    }


# ============================================================
# SPENDING BY CATEGORY
# ============================================================

@router.get("/spending-by-category")
def spending_by_category(
    month: int | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    try:
        start_date, end_date = _date_range(
            month,
            year
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    query = (
        db.query(
            Expense.category,
            func.sum(
                Expense.amount
            ).label("total")
        )
        .filter(
            Expense.user_id == current_user.id
        )
        .group_by(
            Expense.category
        )
        .order_by(
            func.sum(
                Expense.amount
            ).desc()
        )
    )

    if start_date:

        query = query.filter(
            Expense.date >= start_date,
            Expense.date < end_date
        )

    rows = query.all()

    total_spending = sum(
        float(row.total or 0)
        for row in rows
    )

    result = []

    for row in rows:

        amount = float(
            row.total or 0
        )

        percentage = (
            (amount / total_spending) * 100
            if total_spending
            else 0
        )

        result.append({

            "category":
                row.category or "Other",

            "total":
                amount,

            "percentage":
                round(
                    percentage,
                    2
                )
        })

    return result


# ============================================================
# BUDGET PROGRESS
# ============================================================

@router.get("/budget-progress")
def budget_progress(
    month: int | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    today = date.today()

    month = (
        today.month
        if month is None
        else month
    )

    year = (
        today.year
        if year is None
        else year
    )

    try:

        start_date, end_date = _date_range(
            month,
            year
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.month == month,
            Budget.year == year
        )
        .all()
    )

    total_budget = 0.0
    total_spent = 0.0

    categories = []

    for budget in budgets:

        expense_query = (
            db.query(
                func.coalesce(
                    func.sum(
                        Expense.amount
                    ),
                    0
                )
            )
            .filter(
                Expense.user_id == current_user.id,

                func.lower(
                    func.trim(
                        Expense.category
                    )
                )
                ==
                budget.category.strip().lower(),

                Expense.date >= start_date,

                Expense.date < end_date
            )
        )

        if budget.bank_account_id is not None:

            expense_query = expense_query.filter(
                Expense.bank_account_id
                ==
                budget.bank_account_id
            )

        spent = float(
            expense_query.scalar() or 0
        )

        limit = float(
            budget.monthly_limit or 0
        )

        remaining = limit - spent

        percentage_used = (
            (spent / limit) * 100
            if limit
            else 0
        )

        total_budget += limit

        total_spent += spent

        categories.append({

            "category":
                budget.category,

            "budget":
                limit,

            "spent":
                spent,

            "remaining":
                remaining,

            "percentage_used":
                round(
                    percentage_used,
                    2
                )
        })

    total_remaining = (
        total_budget
        - total_spent
    )

    overall_percentage = (
        (total_spent / total_budget) * 100
        if total_budget
        else 0
    )

    return {

        "month":
            month,

        "year":
            year,

        "total_budget":
            total_budget,

        "total_spent":
            total_spent,

        "remaining":
            total_remaining,

        "percentage_used":
            round(
                overall_percentage,
                2
            ),

        "categories":
            categories
    }


# ============================================================
# SAVINGS GOALS
# ============================================================

@router.get("/savings-goals")
def dashboard_savings_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    goals = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id
            ==
            current_user.id
        )
        .order_by(
            SavingsGoal.created_at.desc()
        )
        .all()
    )

    result = []

    for goal in goals[:6]:

        target = float(
            goal.target_amount or 0
        )

        current = float(
            goal.current_amount or 0
        )

        percentage = (
            (current / target) * 100
            if target
            else 0
        )

        percentage = min(
            percentage,
            100
        )

        result.append({

            "id":
                goal.id,

            "goal_name":
                goal.goal_name,

            "target_amount":
                target,

            "current_amount":
                current,

            "remaining":
                max(
                    target - current,
                    0
                ),

            "percentage":
                round(
                    percentage,
                    2
                ),

            "completed":
                current >= target
                if target
                else False
        })

    return result


# ============================================================
# RECENT TRANSACTIONS
# ============================================================

@router.get("/recent-transactions")
def recent_transactions(
    month: int | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    try:

        start_date, end_date = _date_range(
            month,
            year
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    transactions = []

    # --------------------------------------------------------
    # INCOME
    # --------------------------------------------------------

    income_query = (
        db.query(Income)
        .filter(
            Income.user_id
            ==
            current_user.id
        )
    )

    # --------------------------------------------------------
    # EXPENSE
    # --------------------------------------------------------

    expense_query = (
        db.query(Expense)
        .filter(
            Expense.user_id
            ==
            current_user.id
        )
    )

    # --------------------------------------------------------
    # SAVINGS
    # --------------------------------------------------------

    savings_query = (
        db.query(
            SavingsTransaction,
            SavingsGoal.goal_name
        )
        .join(
            SavingsGoal,
            SavingsGoal.id
            ==
            SavingsTransaction.goal_id
        )
        .filter(
            SavingsTransaction.user_id
            ==
            current_user.id
        )
    )

    # --------------------------------------------------------
    # DATE FILTER
    # --------------------------------------------------------

    if start_date:

        income_query = income_query.filter(
            Income.date >= start_date,
            Income.date < end_date
        )

        expense_query = expense_query.filter(
            Expense.date >= start_date,
            Expense.date < end_date
        )

        savings_query = savings_query.filter(
            SavingsTransaction.transaction_date
            >= start_date,

            SavingsTransaction.transaction_date
            < end_date
        )

    # --------------------------------------------------------
    # ADD INCOME
    # --------------------------------------------------------

    for item in income_query.all():

        transactions.append({

            "id":
                f"income-{item.id}",

            "date":
                item.date,

            "description":
                item.source,

            "category":
                item.category,

            "type":
                "Income",

            "amount":
                float(item.amount)
        })

    # --------------------------------------------------------
    # ADD EXPENSE
    # --------------------------------------------------------

    for item in expense_query.all():

        transactions.append({

            "id":
                f"expense-{item.id}",

            "date":
                item.date,

            "description":
                item.description
                or item.category,

            "category":
                item.category,

            "type":
                "Expense",

            "amount":
                float(item.amount)
        })

    # --------------------------------------------------------
    # ADD SAVINGS
    # --------------------------------------------------------

    for item, goal_name in savings_query.all():

        transactions.append({

            "id":
                f"saving-{item.id}",

            "date":
                item.transaction_date,

            "description":
                goal_name
                or "Savings",

            "category":
                "Savings",

            "type":
                "Savings",

            "amount":
                float(item.amount)
        })

    # --------------------------------------------------------
    # SORT
    # --------------------------------------------------------

    transactions.sort(
        key=lambda item: item["date"],
        reverse=True
    )

    # --------------------------------------------------------
    # RETURN ONLY RECENT 10
    # --------------------------------------------------------

    return transactions[:10]