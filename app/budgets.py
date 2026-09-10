from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db

from app.models import (
    Budget,
    Expense,
    User,
    BankAccount,
    Notification,
)

from app.schemas import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetSummaryResponse,
)

from app.users import get_current_user


router = APIRouter(
    prefix="/budgets",
    tags=["Budgets"]
)


# ==========================================================
# CREATE BUDGET
# ==========================================================

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

    # ------------------------------------------------------
    # VALIDATE CATEGORY
    # ------------------------------------------------------

    if not category:
        raise HTTPException(
            status_code=400,
            detail="Category cannot be empty"
        )

    # ------------------------------------------------------
    # VALIDATE AMOUNT
    # ------------------------------------------------------

    if budget_data.monthly_limit <= 0:
        raise HTTPException(
            status_code=400,
            detail="Monthly limit must be greater than 0"
        )

    # ------------------------------------------------------
    # VALIDATE MONTH
    # ------------------------------------------------------

    if budget_data.month < 1 or budget_data.month > 12:
        raise HTTPException(
            status_code=400,
            detail="Month must be between 1 and 12"
        )

    # ------------------------------------------------------
    # VALIDATE BANK ACCOUNT
    # BANK ACCOUNT IS COMPULSORY FOR BUDGET
    # ------------------------------------------------------

    if budget_data.bank_account_id is None:
        raise HTTPException(
            status_code=400,
            detail="Bank account is required for a budget"
        )

    bank_account = (
        db.query(BankAccount)
        .filter(
            BankAccount.id == budget_data.bank_account_id,
            BankAccount.user_id == current_user.id
        )
        .first()
    )

    if bank_account is None:
        raise HTTPException(
            status_code=404,
            detail="Bank account not found"
        )

    # ------------------------------------------------------
    # CHECK DUPLICATE
    #
    # One budget per category + month + year.
    #
    # Bank account does NOT determine the budget.
    # ------------------------------------------------------

    existing_budget = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,

            func.lower(
                func.trim(Budget.category)
            ) == category.lower(),

            Budget.month == budget_data.month,

            Budget.year == budget_data.year
        )
        .first()
    )

    if existing_budget:
        raise HTTPException(
            status_code=400,
            detail=(
                "A budget already exists for this "
                "category, month and year"
            )
        )

    # ------------------------------------------------------
    # CREATE BUDGET
    # ------------------------------------------------------

    new_budget = Budget(
        user_id=current_user.id,
        category=category,
        monthly_limit=budget_data.monthly_limit,
        month=budget_data.month,
        year=budget_data.year,

        # Bank account is stored because it is compulsory
        # when creating the budget.
        bank_account_id=budget_data.bank_account_id
    )

    db.add(new_budget)

    db.commit()
    db.refresh(new_budget)

    # ------------------------------------------------------
    # NOTIFICATION
    # ------------------------------------------------------

    notification = Notification(
        user_id=current_user.id,
        message=(
            f"Budget for '{category}' "
            f"created successfully for "
            f"{bank_account.bank_name}."
        ),
        notification_type="budget",
        created_at=datetime.now(timezone.utc)
    )

    db.add(notification)

    db.commit()

    return new_budget


# ==========================================================
# GET BUDGET SUMMARY
# ==========================================================

@router.get(
    "",
    response_model=list[BudgetSummaryResponse]
)
def get_budgets(
    month: int | None = None,
    year: int | None = None,

    # Optional filter.
    # This is ONLY for viewing/filtering budgets.
    # It does NOT affect spending calculation.
    bank_account_id: int | None = None,

    db: Session = Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    today = date.today()

    if month is None:
        month = today.month

    if year is None:
        year = today.year

    # ------------------------------------------------------
    # VALIDATE MONTH
    # ------------------------------------------------------

    if month < 1 or month > 12:
        raise HTTPException(
            status_code=400,
            detail="Month must be between 1 and 12"
        )

    # ------------------------------------------------------
    # VALIDATE BANK FILTER
    # ------------------------------------------------------

    if bank_account_id is not None:

        bank = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == bank_account_id,
                BankAccount.user_id == current_user.id
            )
            .first()
        )

        if bank is None:
            raise HTTPException(
                status_code=404,
                detail="Bank account not found"
            )

    # ------------------------------------------------------
    # DATE RANGE
    # ------------------------------------------------------

    start_date = date(
        year,
        month,
        1
    )

    if month == 12:

        end_date = date(
            year + 1,
            1,
            1
        )

    else:

        end_date = date(
            year,
            month + 1,
            1
        )

    # ------------------------------------------------------
    # GET BUDGETS
    # ------------------------------------------------------

    budget_query = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,

            Budget.month == month,

            Budget.year == year
        )
    )

    # Optional bank filter for displaying budgets
    if bank_account_id is not None:

        budget_query = budget_query.filter(
            Budget.bank_account_id == bank_account_id
        )

    budgets = (
        budget_query
        .order_by(Budget.category)
        .all()
    )

    result = []

    # ------------------------------------------------------
    # CALCULATE SPENDING
    #
    # IMPORTANT:
    #
    # Budget spending is based on:
    #     1. Category
    #     2. Month
    #     3. Year
    #
    # NOT bank account.
    #
    # Therefore expenses from SBI + HDFC + ICICI etc.
    # are all counted toward the same category budget.
    # ------------------------------------------------------

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

                func.lower(
                    func.trim(Expense.category)
                ) == budget.category.strip().lower(),

                Expense.date >= start_date,

                Expense.date < end_date
            )
            .scalar()
            or 0
        )

        monthly_limit = float(
            budget.monthly_limit
        )

        spent = float(spent)

        remaining = (
            monthly_limit - spent
        )

        if monthly_limit > 0:

            percentage_used = round(
                (
                    spent /
                    monthly_limit
                ) * 100,
                2
            )

        else:

            percentage_used = 0

        result.append(
            {
                "id": budget.id,

                "category":
                    budget.category,

                "monthly_limit":
                    monthly_limit,

                "month":
                    budget.month,

                "year":
                    budget.year,

                "spent":
                    spent,

                "remaining":
                    remaining,

                "percentage_used":
                    percentage_used,

                # Keep the bank account ID because
                # the budget was created with a compulsory
                # bank account.
                "bank_account_id":
                    budget.bank_account_id,
            }
        )

    return result


# ==========================================================
# GET ONE BUDGET
# ==========================================================

@router.get(
    "/{budget_id}",
    response_model=BudgetResponse
)
def get_budget(
    budget_id: int,

    db: Session =
        Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    budget = (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,

            Budget.user_id ==
            current_user.id
        )
        .first()
    )

    if budget is None:

        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    return budget


# ==========================================================
# UPDATE BUDGET
# ==========================================================

@router.put(
    "/{budget_id}",
    response_model=BudgetResponse
)
def update_budget(
    budget_id: int,

    budget_data: BudgetUpdate,

    db: Session =
        Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    budget = (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,

            Budget.user_id ==
            current_user.id
        )
        .first()
    )

    if budget is None:

        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    category = (
        budget_data.category.strip()
    )

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

    if (
        budget_data.month < 1
        or budget_data.month > 12
    ):

        raise HTTPException(
            status_code=400,
            detail="Month must be between 1 and 12"
        )

    # ------------------------------------------------------
    # BANK ACCOUNT IS STILL COMPULSORY
    # ------------------------------------------------------

    if budget_data.bank_account_id is None:

        raise HTTPException(
            status_code=400,
            detail="Bank account is required for a budget"
        )

    bank_account = (
        db.query(BankAccount)
        .filter(
            BankAccount.id ==
            budget_data.bank_account_id,

            BankAccount.user_id ==
            current_user.id
        )
        .first()
    )

    if bank_account is None:

        raise HTTPException(
            status_code=404,
            detail="Bank account not found"
        )

    # ------------------------------------------------------
    # CHECK DUPLICATE
    #
    # Category + month + year must be unique.
    # Bank is NOT part of budget identity.
    # ------------------------------------------------------

    duplicate = (
        db.query(Budget)
        .filter(
            Budget.user_id ==
            current_user.id,

            Budget.id != budget_id,

            func.lower(
                func.trim(Budget.category)
            ) == category.lower(),

            Budget.month ==
            budget_data.month,

            Budget.year ==
            budget_data.year
        )
        .first()
    )

    if duplicate:

        raise HTTPException(
            status_code=400,
            detail=(
                "Budget already exists for "
                "this category, month and year"
            )
        )

    # ------------------------------------------------------
    # UPDATE
    # ------------------------------------------------------

    budget.category = category

    budget.monthly_limit = (
        budget_data.monthly_limit
    )

    budget.month = (
        budget_data.month
    )

    budget.year = (
        budget_data.year
    )

    budget.bank_account_id = (
        budget_data.bank_account_id
    )

    db.commit()

    db.refresh(budget)

    return budget


# ==========================================================
# DELETE BUDGET
# ==========================================================

@router.delete(
    "/{budget_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_budget(
    budget_id: int,

    db: Session =
        Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    budget = (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,

            Budget.user_id ==
            current_user.id
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