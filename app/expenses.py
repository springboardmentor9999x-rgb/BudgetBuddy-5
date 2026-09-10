from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db

from app.models import (
    Expense,
    User,
    BankAccount,
    Budget,
    Notification,
)

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


# ==========================================================
# VALIDATE DESCRIPTION
# ==========================================================

def validate_description(description):

    if description is None or not str(description).strip():

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expense description is required"
        )

    return str(description).strip()


# ==========================================================
# CREATE EXPENSE
# ==========================================================

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

    # ======================================================
    # VALIDATE DESCRIPTION
    # ======================================================

    expense.description = validate_description(
        expense.description
    )


    # ======================================================
    # CHECK BANK ACCOUNT
    #
    # Bank account is used ONLY for:
    #     - Checking available balance
    #     - Deducting money from that account
    #
    # It does NOT decide which budget is affected.
    # ======================================================

    bank = None

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

        # --------------------------------------------------
        # CHECK BANK BALANCE
        # --------------------------------------------------

        if float(bank.current_balance) < float(
            expense.amount
        ):

            raise HTTPException(
                status_code=400,
                detail="Insufficient bank balance"
            )


    # ======================================================
    # EXPENSE MONTH / YEAR
    # ======================================================

    expense_month = expense.date.month
    expense_year = expense.date.year


    # ======================================================
    # FIND MATCHING BUDGET
    #
    # IMPORTANT:
    #
    # Budget is matched ONLY using:
    #     1. Category
    #     2. Month
    #     3. Year
    #
    # Bank account is NOT used here.
    #
    # Example:
    #
    # Food Budget = ₹5000
    #
    # Food ₹1000 from SBI
    # Food ₹500 from HDFC
    # Food ₹700 from ICICI
    #
    # Budget spent = ₹2200
    # ======================================================

    budget = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,

            func.lower(
                func.trim(Budget.category)
            )
            ==
            expense.category.strip().lower(),

            Budget.month == expense_month,

            Budget.year == expense_year
        )
        .first()
    )


    # ======================================================
    # DATE RANGE FOR BUDGET MONTH
    # ======================================================

    start_date = date(
        expense_year,
        expense_month,
        1
    )

    if expense_month == 12:

        end_date = date(
            expense_year + 1,
            1,
            1
        )

    else:

        end_date = date(
            expense_year,
            expense_month + 1,
            1
        )


    # ======================================================
    # CALCULATE SPENDING BEFORE THIS EXPENSE
    #
    # IMPORTANT:
    #
    # DO NOT FILTER BY BANK ACCOUNT.
    #
    # All expenses belonging to this category
    # in this month/year are counted.
    # ======================================================

    spent_before = (
        db.query(
            func.coalesce(
                func.sum(Expense.amount),
                0
            )
        )
        .filter(

            Expense.user_id ==
            current_user.id,

            func.lower(
                func.trim(Expense.category)
            )
            ==
            expense.category.strip().lower(),

            Expense.date >= start_date,

            Expense.date < end_date
        )
        .scalar()
    )


    spent_before = float(
        spent_before or 0
    )


    # ======================================================
    # CURRENT EXPENSE AMOUNT
    # ======================================================

    expense_amount = float(
        expense.amount
    )


    # ======================================================
    # TOTAL SPENDING AFTER THIS EXPENSE
    # ======================================================

    spent_after = (
        spent_before +
        expense_amount
    )


    # ======================================================
    # CREATE EXPENSE
    # ======================================================

    new_expense = Expense(

        user_id=current_user.id,

        category=expense.category,

        payment_method=
            expense.payment_method,

        amount=expense.amount,

        description=
            expense.description,

        date=expense.date,

        bank_account_id=
            expense.bank_account_id
    )

    db.add(new_expense)


    # ======================================================
    # SUBTRACT MONEY FROM BANK
    #
    # THIS IS COMPLETELY SEPARATE FROM BUDGET.
    #
    # Example:
    #
    # Food expense ₹1000 from SBI
    #     ↓
    # SBI balance -₹1000
    #
    # Food budget
    #     ↓
    # Food spent +₹1000
    # ======================================================

    if bank is not None:

        bank.current_balance = (
            float(bank.current_balance)
            -
            expense_amount
        )


    # ======================================================
    # EXPENSE ADDED NOTIFICATION
    # ======================================================

    now = datetime.now(timezone.utc)

    expense_notification = Notification(

        user_id=current_user.id,

        message=(
            f"Expense of ₹{expense_amount:.2f} "
            f"added for {expense.category}"
        ),

        notification_type="expense",

        is_read=False,

        created_at=now
    )

    db.add(
        expense_notification
    )


    # ======================================================
    # BUDGET NOTIFICATIONS
    #
    # Since spent_before now includes ALL bank accounts,
    # these notifications also represent the complete
    # category spending.
    # ======================================================

    if budget is not None:

        monthly_limit = float(
            budget.monthly_limit
        )

        if monthly_limit > 0:

            percentage_before = (
                spent_before /
                monthly_limit
            ) * 100

            percentage_after = (
                spent_after /
                monthly_limit
            ) * 100


            # ==================================================
            # 50% BUDGET ALERT
            # ==================================================

            if (
                percentage_before < 50
                and
                percentage_after >= 50
            ):

                notification_50 = Notification(

                    user_id=current_user.id,

                    message=(
                        f"Budget alert! You have used "
                        f"{percentage_after:.2f}% of your "
                        f"{budget.category} budget. "
                        f"Spent ₹{spent_after:.2f} "
                        f"out of ₹{monthly_limit:.2f}."
                    ),

                    notification_type=
                        "budget_50_percent",

                    is_read=False,

                    created_at=now
                )

                db.add(
                    notification_50
                )


            # ==================================================
            # 90% BUDGET WARNING
            # ==================================================

            if (
                percentage_before < 90
                and
                percentage_after >= 90
            ):

                notification_90 = Notification(

                    user_id=current_user.id,

                    message=(
                        f"Budget warning! You have used "
                        f"{percentage_after:.2f}% of your "
                        f"{budget.category} budget. "
                        f"Spent ₹{spent_after:.2f} "
                        f"out of ₹{monthly_limit:.2f}."
                    ),

                    notification_type=
                        "budget_warning",

                    is_read=False,

                    created_at=now
                )

                db.add(
                    notification_90
                )


            # ==================================================
            # 100% BUDGET LIMIT
            # ==================================================

            if (
                percentage_before < 100
                and
                percentage_after >= 100
            ):

                notification_100 = Notification(

                    user_id=current_user.id,

                    message=(
                        f"Budget warning! 100% "
                        f"budget limit reached for "
                        f"{budget.category}! "
                        f"You spent ₹{spent_after:.2f} "
                        f"out of ₹{monthly_limit:.2f}."
                    ),

                    notification_type=
                        "budget_limit",

                    is_read=False,

                    created_at=now
                )

                db.add(
                    notification_100
                )


    # ======================================================
    # SAVE EVERYTHING
    # ======================================================

    db.commit()

    db.refresh(
        new_expense
    )

    return new_expense


# ==========================================================
# GET ALL EXPENSES
# ==========================================================

@router.get(
    "",
    response_model=list[ExpenseResponse]
)
def get_all_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    expenses = (
        db.query(Expense)
        .filter(
            Expense.user_id ==
            current_user.id
        )
        .order_by(
            Expense.date.desc(),
            Expense.id.desc()
        )
        .all()
    )

    return expenses


# ==========================================================
# TOTAL EXPENSE
# ==========================================================

@router.get("/total")
def total_expense(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    total = (
        db.query(
            func.coalesce(
                func.sum(Expense.amount),
                0
            )
        )
        .filter(
            Expense.user_id ==
            current_user.id
        )
        .scalar()
    )

    return {
        "total_expense": total or 0
    }


# ==========================================================
# GET SINGLE EXPENSE
# ==========================================================

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

            Expense.user_id ==
            current_user.id
        )
        .first()
    )

    if expense is None:

        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    return expense


# ==========================================================
# UPDATE EXPENSE
# ==========================================================

@router.put(
    "/{expense_id}",
    response_model=ExpenseResponse
)
def update_expense(
    expense_id: int,
    expense_data: ExpenseUpdate,

    db: Session = Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    # ======================================================
    # VALIDATE DESCRIPTION
    # ======================================================

    expense_data.description = (
        validate_description(
            expense_data.description
        )
    )


    # ======================================================
    # FIND EXPENSE
    # ======================================================

    expense = (
        db.query(Expense)
        .filter(
            Expense.id == expense_id,

            Expense.user_id ==
            current_user.id
        )
        .first()
    )

    if expense is None:

        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )


    # ======================================================
    # OLD BANK
    # ======================================================

    old_bank = None

    if expense.bank_account_id is not None:

        old_bank = (
            db.query(BankAccount)
            .filter(
                BankAccount.id ==
                expense.bank_account_id,

                BankAccount.user_id ==
                current_user.id
            )
            .first()
        )


    # ======================================================
    # NEW BANK
    # ======================================================

    new_bank = None

    if expense_data.bank_account_id is not None:

        new_bank = (
            db.query(BankAccount)
            .filter(
                BankAccount.id ==
                expense_data.bank_account_id,

                BankAccount.user_id ==
                current_user.id
            )
            .first()
        )

        if new_bank is None:

            raise HTTPException(
                status_code=404,
                detail="Bank account not found"
            )


    # ======================================================
    # RESTORE OLD BANK BALANCE
    # ======================================================

    if old_bank is not None:

        old_bank.current_balance = (
            float(old_bank.current_balance)
            +
            float(expense.amount)
        )


    # ======================================================
    # CHECK NEW BANK BALANCE
    # ======================================================

    if new_bank is not None:

        if (
            float(new_bank.current_balance)
            <
            float(expense_data.amount)
        ):

            # Undo restoration

            if old_bank is not None:

                old_bank.current_balance = (
                    float(old_bank.current_balance)
                    -
                    float(expense.amount)
                )

            raise HTTPException(
                status_code=400,
                detail="Insufficient bank balance"
            )


    # ======================================================
    # UPDATE EXPENSE
    # ======================================================

    expense.category = (
        expense_data.category
    )

    expense.payment_method = (
        expense_data.payment_method
    )

    expense.amount = (
        expense_data.amount
    )

    expense.description = (
        expense_data.description
    )

    expense.date = (
        expense_data.date
    )

    expense.bank_account_id = (
        expense_data.bank_account_id
    )


    # ======================================================
    # SUBTRACT NEW AMOUNT FROM NEW BANK
    # ======================================================

    if new_bank is not None:

        new_bank.current_balance = (
            float(new_bank.current_balance)
            -
            float(expense_data.amount)
        )


    # ======================================================
    # SAVE UPDATE
    # ======================================================

    db.commit()

    db.refresh(expense)

    return expense


# ==========================================================
# DELETE EXPENSE
# ==========================================================

@router.delete(
    "/{expense_id}"
)
def delete_expense(
    expense_id: int,

    db: Session = Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    # ======================================================
    # FIND EXPENSE
    # ======================================================

    expense = (
        db.query(Expense)
        .filter(
            Expense.id == expense_id,

            Expense.user_id ==
            current_user.id
        )
        .first()
    )

    if expense is None:

        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )


    # ======================================================
    # RESTORE BANK BALANCE
    # ======================================================

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

            bank.current_balance = (
                float(bank.current_balance)
                +
                float(expense.amount)
            )


    # ======================================================
    # DELETE EXPENSE
    # ======================================================

    db.delete(expense)

    db.commit()


    return {
        "message":
            "Expense deleted successfully"
    }