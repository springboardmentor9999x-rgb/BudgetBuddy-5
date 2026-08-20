from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Budget, Expense, User
from app.schemas import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetSummaryResponse
)
from app.users import get_current_user


router = APIRouter(
    prefix="/budgets",
    tags=["Budgets"]
)


# ==================================================
# CREATE BUDGET
# ==================================================

@router.post(
    "",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED
)
def create_budget(
    budget_data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    category = budget_data.category.strip()

    # Validate category
    if not category:
        raise HTTPException(
            status_code=400,
            detail="Category cannot be empty"
        )

    # Validate amount
    if budget_data.monthly_limit <= 0:
        raise HTTPException(
            status_code=400,
            detail="Monthly limit must be greater than 0"
        )

    # Validate month
    if budget_data.month < 1 or budget_data.month > 12:
        raise HTTPException(
            status_code=400,
            detail="Month must be between 1 and 12"
        )

    # Check duplicate budget
    existing_budget = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            func.lower(func.trim(Budget.category))
            == category.lower(),
            Budget.month == budget_data.month,
            Budget.year == budget_data.year
        )
        .first()
    )

    if existing_budget:
        raise HTTPException(
            status_code=400,
            detail=(
                "A budget already exists for this category "
                "in the selected month and year"
            )
        )

    new_budget = Budget(
        user_id=current_user.id,
        category=category,
        monthly_limit=budget_data.monthly_limit,
        month=budget_data.month,
        year=budget_data.year
    )

    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)

    return new_budget


# ==================================================
# GET BUDGET SUMMARY
# ==================================================
# Example:
# GET /budgets?month=8&year=2026
#
# If month/year are not given, current month/year is used.
# ==================================================

@router.get(
    "",
    response_model=list[BudgetSummaryResponse]
)
def get_budgets(
    month: int | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Use current date if no filter is provided
    today = date.today()

    if month is None:
        month = today.month

    if year is None:
        year = today.year

    # Validate month
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=400,
            detail="Month must be between 1 and 12"
        )

    # ------------------------------------------
    # DATE RANGE FOR SELECTED MONTH
    # ------------------------------------------

    start_date = date(year, month, 1)

    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    # ------------------------------------------
    # GET USER BUDGETS
    # ------------------------------------------

    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.month == month,
            Budget.year == year
        )
        .order_by(Budget.category)
        .all()
    )

    result = []

    # ------------------------------------------
    # CALCULATE SPENDING FOR EVERY BUDGET
    # ------------------------------------------

    for budget in budgets:

        spent = (
            db.query(
                func.coalesce(
                    func.sum(Expense.amount),
                    0
                )
            )
            .filter(
                Expense.user_id == current_user.id,

                # Same category
                func.lower(func.trim(Expense.category))
                ==
                budget.category.strip().lower(),

                # Same selected month
                Expense.date >= start_date,
                Expense.date < end_date
            )
            .scalar()
        )

        monthly_limit = float(budget.monthly_limit)
        spent = float(spent)

        remaining = monthly_limit - spent

        if monthly_limit > 0:
            percentage_used = round(
                (spent / monthly_limit) * 100,
                2
            )
        else:
            percentage_used = 0

        result.append(
            {
                "id": budget.id,
                "category": budget.category,
                "monthly_limit": monthly_limit,
                "month": budget.month,
                "year": budget.year,
                "spent": spent,
                "remaining": remaining,
                "percentage_used": percentage_used
            }
        )

    return result


# ==================================================
# GET ONE BUDGET
# ==================================================

@router.get(
    "/{budget_id}",
    response_model=BudgetResponse
)
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    budget = (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,
            Budget.user_id == current_user.id
        )
        .first()
    )

    if budget is None:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    return budget


# ==================================================
# UPDATE BUDGET
# ==================================================

@router.put(
    "/{budget_id}",
    response_model=BudgetResponse
)
def update_budget(
    budget_id: int,
    budget_data: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    budget = (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,
            Budget.user_id == current_user.id
        )
        .first()
    )

    if budget is None:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    category = budget_data.category.strip()

    if not category:
        raise HTTPException(
            status_code=400,
            detail="Category cannot be empty"
        )

    if budget_data.monthly_limit <= 0:
        raise HTTPException(
            status_code=400,
            detail="Monthly limit must be greater than 0"
        )

    if budget_data.month < 1 or budget_data.month > 12:
        raise HTTPException(
            status_code=400,
            detail="Month must be between 1 and 12"
        )

    # Check duplicate excluding current budget
    duplicate = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.id != budget_id,
            func.lower(func.trim(Budget.category))
            == category.lower(),
            Budget.month == budget_data.month,
            Budget.year == budget_data.year
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail="Budget already exists for this category and month"
        )

    budget.category = category
    budget.monthly_limit = budget_data.monthly_limit
    budget.month = budget_data.month
    budget.year = budget_data.year

    db.commit()
    db.refresh(budget)

    return budget


# ==================================================
# DELETE BUDGET
# ==================================================

@router.delete(
    "/{budget_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    budget = (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,
            Budget.user_id == current_user.id
        )
        .first()
    )

    if budget is None:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    db.delete(budget)
    db.commit()

    return None