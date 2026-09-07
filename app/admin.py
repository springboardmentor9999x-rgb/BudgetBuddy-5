from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

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

from app.users import require_admin, get_current_user
from app.auth import hash_password


# ==========================================================
# ROUTER
# ==========================================================

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# ==========================================================
# ADMIN DASHBOARD SUMMARY
# ==========================================================

@router.get("/dashboard")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    total_users = db.query(User).count()

    total_admins = (
        db.query(User)
        .filter(User.role == "admin")
        .count()
    )

    normal_users = (
        db.query(User)
        .filter(
            User.role == "user",
            User.plan == "normal"
        )
        .count()
    )

    premium_users = (
        db.query(User)
        .filter(
            User.role == "user",
            User.plan == "premium"
        )
        .count()
    )

    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "normal_users": normal_users,
        "premium_users": premium_users
    }


# ==========================================================
# CURRENT USER - PERSONAL USER MANAGEMENT
# ==========================================================

@router.get("/me")
def get_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Return only the logged-in user's own account,
    financial summary, and activity counts.

    This endpoint is intentionally available to normal,
    premium, and admin users, while returning only the
    authenticated user's data.
    """

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

    bank_accounts = (
        db.query(BankAccount)
        .filter(
            BankAccount.user_id == current_user.id
        )
        .count()
    )

    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id
        )
        .count()
    )

    savings_goals = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == current_user.id
        )
        .count()
    )

    income_records = (
        db.query(Income)
        .filter(
            Income.user_id == current_user.id
        )
        .count()
    )

    expense_records = (
        db.query(Expense)
        .filter(
            Expense.user_id == current_user.id
        )
        .count()
    )

    plan = (
        "admin"
        if current_user.role == "admin"
        else (current_user.plan or "normal")
    )

    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role,
            "plan": plan,
            "verified": current_user.verified,
            "created_at": current_user.created_at,
        },
        "financial_summary": {
            "total_income": float(total_income or 0),
            "total_expense": float(total_expense or 0),
            "total_savings": float(total_savings or 0),
            "net_balance": (
                float(total_income or 0)
                - float(total_expense or 0)
            ),
        },
        "activity": {
            "bank_accounts": bank_accounts,
            "budgets": budgets,
            "savings_goals": savings_goals,
            "income_records": income_records,
            "expense_records": expense_records,
        },
    }


# ==========================================================
# SYSTEM ANALYTICS
# ==========================================================

@router.get("/analytics")
def system_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    # ------------------------------------------------------
    # USER COUNTS
    # ------------------------------------------------------

    total_users = db.query(User).count()

    total_admins = (
        db.query(User)
        .filter(User.role == "admin")
        .count()
    )

    normal_users = (
        db.query(User)
        .filter(
            User.role == "user",
            User.plan == "normal"
        )
        .count()
    )

    premium_users = (
        db.query(User)
        .filter(
            User.role == "user",
            User.plan == "premium"
        )
        .count()
    )

    verified_users = (
        db.query(User)
        .filter(User.verified == True)
        .count()
    )

    unverified_users = (
        db.query(User)
        .filter(User.verified == False)
        .count()
    )

    # ------------------------------------------------------
    # FINANCIAL DATA
    # ------------------------------------------------------

    total_income = (
        db.query(
            func.coalesce(
                func.sum(Income.amount),
                0
            )
        )
        .scalar()
    )

    total_expense = (
        db.query(
            func.coalesce(
                func.sum(Expense.amount),
                0
            )
        )
        .scalar()
    )

    total_saved = (
        db.query(
            func.coalesce(
                func.sum(SavingsTransaction.amount),
                0
            )
        )
        .scalar()
    )

    # ------------------------------------------------------
    # OTHER COUNTS
    # ------------------------------------------------------

    total_bank_accounts = (
        db.query(BankAccount).count()
    )

    total_budgets = (
        db.query(Budget).count()
    )

    total_savings_goals = (
        db.query(SavingsGoal).count()
    )

    total_income_records = (
        db.query(Income).count()
    )

    total_expense_records = (
        db.query(Expense).count()
    )

    total_savings_transactions = (
        db.query(SavingsTransaction).count()
    )

    # ------------------------------------------------------
    # NET SYSTEM BALANCE
    # ------------------------------------------------------

    net_balance = (
        float(total_income or 0)
        - float(total_expense or 0)
    )

    # ------------------------------------------------------
    # PREMIUM PERCENTAGE
    # ------------------------------------------------------

    if total_users > 0:

        premium_percentage = (
            premium_users / total_users
        ) * 100

    else:

        premium_percentage = 0

    # ------------------------------------------------------
    # NORMAL USER PERCENTAGE
    # ------------------------------------------------------

    if total_users > 0:

        normal_percentage = (
            normal_users / total_users
        ) * 100

    else:

        normal_percentage = 0

    # ------------------------------------------------------
    # RETURN ANALYTICS
    # ------------------------------------------------------

    return {

        "users": {
            "total": total_users,
            "admins": total_admins,
            "normal": normal_users,
            "premium": premium_users,
            "verified": verified_users,
            "unverified": unverified_users,
        },

        "financial": {
            "total_income": float(
                total_income or 0
            ),

            "total_expense": float(
                total_expense or 0
            ),

            "total_saved": float(
                total_saved or 0
            ),

            "net_balance": net_balance,
        },

        "system": {
            "bank_accounts":
                total_bank_accounts,

            "budgets":
                total_budgets,

            "savings_goals":
                total_savings_goals,

            "income_records":
                total_income_records,

            "expense_records":
                total_expense_records,

            "savings_transactions":
                total_savings_transactions,
        },

        "percentages": {
            "premium_users":
                round(
                    premium_percentage,
                    2
                ),

            "normal_users":
                round(
                    normal_percentage,
                    2
                ),
        }
    }



# ==========================================================
# COMPLETE ADMIN SYSTEM ANALYTICS
# ==========================================================

@router.get("/analytics/full")
def complete_system_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin-only system-wide analytics.
    Includes combined financial data, monthly trends,
    expense categories, savings goals, and per-user analytics.
    """

    # ------------------------------------------------------
    # COMBINED FINANCIAL TOTALS
    # ------------------------------------------------------

    total_income = float(
        db.query(
            func.coalesce(func.sum(Income.amount), 0)
        ).scalar() or 0
    )

    total_expense = float(
        db.query(
            func.coalesce(func.sum(Expense.amount), 0)
        ).scalar() or 0
    )

    total_saved = float(
        db.query(
            func.coalesce(func.sum(SavingsTransaction.amount), 0)
        ).scalar() or 0
    )

    total_bank_balance = float(
        db.query(
            func.coalesce(func.sum(BankAccount.current_balance), 0)
        ).scalar() or 0
    )

    # Keep the same accounting definition used by the existing
    # admin analytics endpoint.
    net_balance = total_income - total_expense

    # ------------------------------------------------------
    # MONTHLY INCOME / EXPENSE / SAVINGS
    # ------------------------------------------------------

    monthly_data = {}

    incomes = db.query(Income).all()
    expenses = db.query(Expense).all()
    savings_transactions = db.query(SavingsTransaction).all()

    for item in incomes:
        if item.date:
            key = item.date.strftime("%Y-%m")
            monthly_data.setdefault(
                key,
                {"month": key, "income": 0, "expense": 0, "savings": 0}
            )
            monthly_data[key]["income"] += float(item.amount or 0)

    for item in expenses:
        if item.date:
            key = item.date.strftime("%Y-%m")
            monthly_data.setdefault(
                key,
                {"month": key, "income": 0, "expense": 0, "savings": 0}
            )
            monthly_data[key]["expense"] += float(item.amount or 0)

    for item in savings_transactions:
        if item.transaction_date:
            key = item.transaction_date.strftime("%Y-%m")
            monthly_data.setdefault(
                key,
                {"month": key, "income": 0, "expense": 0, "savings": 0}
            )
            monthly_data[key]["savings"] += float(item.amount or 0)

    monthly = sorted(
        monthly_data.values(),
        key=lambda item: item["month"]
    )[-12:]

    # Make chart labels cleaner.
    for item in monthly:
        year, month = item["month"].split("-")
        item["label"] = f"{month}/{year}"

    # ------------------------------------------------------
    # EXPENSE CATEGORY DISTRIBUTION
    # ------------------------------------------------------

    category_totals = {}

    for item in expenses:
        category = (item.category or "Other").strip() or "Other"
        category_totals[category] = (
            category_totals.get(category, 0)
            + float(item.amount or 0)
        )

    expense_categories = [
        {
            "category": category,
            "amount": round(amount, 2),
        }
        for category, amount in sorted(
            category_totals.items(),
            key=lambda pair: pair[1],
            reverse=True
        )
    ]

    # ------------------------------------------------------
    # SAVINGS GOALS
    # ------------------------------------------------------

    goals = (
        db.query(SavingsGoal)
        .order_by(SavingsGoal.created_at.desc())
        .all()
    )

    savings_goals = [
        {
            "id": goal.id,
            "goal_name": goal.goal_name,
            "target_amount": float(goal.target_amount or 0),
            "current_amount": float(goal.current_amount or 0),
            "user_id": goal.user_id,
        }
        for goal in goals
    ]

    # ------------------------------------------------------
    # PER-USER ANALYTICS
    # ------------------------------------------------------

    users = (
        db.query(User)
        .order_by(User.id.desc())
        .all()
    )

    user_analytics = []

    for user in users:

        user_income = float(
            db.query(
                func.coalesce(func.sum(Income.amount), 0)
            )
            .filter(Income.user_id == user.id)
            .scalar() or 0
        )

        user_expense = float(
            db.query(
                func.coalesce(func.sum(Expense.amount), 0)
            )
            .filter(Expense.user_id == user.id)
            .scalar() or 0
        )

        user_saved = float(
            db.query(
                func.coalesce(func.sum(SavingsTransaction.amount), 0)
            )
            .filter(SavingsTransaction.user_id == user.id)
            .scalar() or 0
        )

        user_bank_balance = float(
            db.query(
                func.coalesce(func.sum(BankAccount.current_balance), 0)
            )
            .filter(BankAccount.user_id == user.id)
            .scalar() or 0
        )

        user_goals = (
            db.query(SavingsGoal)
            .filter(SavingsGoal.user_id == user.id)
            .all()
        )

        # --------------------------------------------------
        # USER MONTHLY INCOME / EXPENSE / SAVINGS
        # --------------------------------------------------

        user_monthly_data = {}

        user_incomes = (
            db.query(Income)
            .filter(Income.user_id == user.id)
            .all()
        )

        user_expenses = (
            db.query(Expense)
            .filter(Expense.user_id == user.id)
            .all()
        )

        user_savings_transactions = (
            db.query(SavingsTransaction)
            .filter(SavingsTransaction.user_id == user.id)
            .all()
        )

        for item in user_incomes:
            if item.date:
                key = item.date.strftime("%Y-%m")
                user_monthly_data.setdefault(
                    key,
                    {
                        "month": key,
                        "income": 0,
                        "expense": 0,
                        "savings": 0,
                    }
                )
                user_monthly_data[key]["income"] += float(
                    item.amount or 0
                )

        for item in user_expenses:
            if item.date:
                key = item.date.strftime("%Y-%m")
                user_monthly_data.setdefault(
                    key,
                    {
                        "month": key,
                        "income": 0,
                        "expense": 0,
                        "savings": 0,
                    }
                )
                user_monthly_data[key]["expense"] += float(
                    item.amount or 0
                )

        for item in user_savings_transactions:
            if item.transaction_date:
                key = item.transaction_date.strftime("%Y-%m")
                user_monthly_data.setdefault(
                    key,
                    {
                        "month": key,
                        "income": 0,
                        "expense": 0,
                        "savings": 0,
                    }
                )
                user_monthly_data[key]["savings"] += float(
                    item.amount or 0
                )

        user_monthly = sorted(
            user_monthly_data.values(),
            key=lambda item: item["month"]
        )[-12:]

        for item in user_monthly:
            year, month = item["month"].split("-")
            item["label"] = f"{month}/{year}"

        # --------------------------------------------------
        # USER EXPENSE CATEGORIES
        # --------------------------------------------------

        user_category_totals = {}

        for item in user_expenses:
            category = (
                (item.category or "Other").strip()
                or "Other"
            )

            user_category_totals[category] = (
                user_category_totals.get(category, 0)
                + float(item.amount or 0)
            )

        user_expense_categories = [
            {
                "category": category,
                "amount": round(amount, 2),
            }
            for category, amount in sorted(
                user_category_totals.items(),
                key=lambda pair: pair[1],
                reverse=True
            )
        ]

        user_analytics.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "plan": (
                "admin"
                if user.role == "admin"
                else (user.plan or "normal")
            ),
            "created_at": user.created_at,
            "total_income": user_income,
            "total_expense": user_expense,
            "total_saved": user_saved,
            "net_balance": user_income - user_expense,
            "bank_balance": user_bank_balance,
            "monthly": user_monthly,
            "expense_categories": user_expense_categories,
            "savings_goals": [
                {
                    "id": goal.id,
                    "goal_name": goal.goal_name,
                    "target_amount": float(goal.target_amount or 0),
                    "current_amount": float(goal.current_amount or 0),
                }
                for goal in user_goals
            ],
        })

    # ------------------------------------------------------
    # USER COUNTS
    # ------------------------------------------------------

    total_users = len(users)
    total_admins = sum(
        1 for item in users if item.role == "admin"
    )
    normal_users = sum(
        1
        for item in users
        if item.role == "user" and (item.plan or "normal") == "normal"
    )
    premium_users = sum(
        1
        for item in users
        if item.role == "user" and item.plan == "premium"
    )

    return {
        "users": {
            "total": total_users,
            "admins": total_admins,
            "normal": normal_users,
            "premium": premium_users,
        },
        "financial": {
            "total_income": round(total_income, 2),
            "total_expense": round(total_expense, 2),
            "total_saved": round(total_saved, 2),
            "total_bank_balance": round(total_bank_balance, 2),
            "net_balance": round(net_balance, 2),
        },
        "system": {
            "bank_accounts": db.query(BankAccount).count(),
            "budgets": db.query(Budget).count(),
            "savings_goals": db.query(SavingsGoal).count(),
            "income_records": db.query(Income).count(),
            "expense_records": db.query(Expense).count(),
            "savings_transactions": db.query(SavingsTransaction).count(),
        },
        "monthly": monthly,
        "expense_categories": expense_categories,
        "savings_goals": savings_goals,
        "user_analytics": user_analytics,
    }


# ==========================================================
# GET ALL USERS
# ==========================================================

@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    users = (
        db.query(User)
        .order_by(User.id.desc())
        .all()
    )

    result = []

    for user in users:

        # --------------------------------------------------
        # USER INCOME
        # --------------------------------------------------

        total_income = (
            db.query(
                func.coalesce(
                    func.sum(Income.amount),
                    0
                )
            )
            .filter(
                Income.user_id == user.id
            )
            .scalar()
        )

        # --------------------------------------------------
        # USER EXPENSE
        # --------------------------------------------------

        total_expense = (
            db.query(
                func.coalesce(
                    func.sum(Expense.amount),
                    0
                )
            )
            .filter(
                Expense.user_id == user.id
            )
            .scalar()
        )

        # --------------------------------------------------
        # BANK ACCOUNTS
        # --------------------------------------------------

        bank_accounts_count = (
            db.query(BankAccount)
            .filter(
                BankAccount.user_id == user.id
            )
            .count()
        )

        # --------------------------------------------------
        # BUDGETS
        # --------------------------------------------------

        budgets_count = (
            db.query(Budget)
            .filter(
                Budget.user_id == user.id
            )
            .count()
        )

        # --------------------------------------------------
        # SAVINGS GOALS
        # --------------------------------------------------

        savings_goals_count = (
            db.query(SavingsGoal)
            .filter(
                SavingsGoal.user_id == user.id
            )
            .count()
        )

        # --------------------------------------------------
        # PLAN
        # --------------------------------------------------

        if user.role == "admin":

            plan = "admin"

        else:

            plan = user.plan or "normal"

        # --------------------------------------------------
        # USER RESULT
        # --------------------------------------------------

        result.append({

            "id":
                user.id,

            "username":
                user.username,

            "email":
                user.email,

            "role":
                user.role,

            "plan":
                plan,

            "verified":
                user.verified,

            "created_at":
                user.created_at,

            "total_income":
                float(total_income or 0),

            "total_expense":
                float(total_expense or 0),

            "bank_accounts_count":
                bank_accounts_count,

            "budgets_count":
                budgets_count,

            "savings_goals_count":
                savings_goals_count,
        })

    return result


# ==========================================================
# GET ONE USER - COMPLETE DETAILS
# ==========================================================

@router.get("/users/{user_id}")
def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # ------------------------------------------------------
    # INCOME
    # ------------------------------------------------------

    total_income = (
        db.query(
            func.coalesce(
                func.sum(Income.amount),
                0
            )
        )
        .filter(
            Income.user_id == user.id
        )
        .scalar()
    )

    # ------------------------------------------------------
    # EXPENSE
    # ------------------------------------------------------

    total_expense = (
        db.query(
            func.coalesce(
                func.sum(Expense.amount),
                0
            )
        )
        .filter(
            Expense.user_id == user.id
        )
        .scalar()
    )

    # ------------------------------------------------------
    # SAVINGS
    # ------------------------------------------------------

    total_savings = (
        db.query(
            func.coalesce(
                func.sum(
                    SavingsTransaction.amount
                ),
                0
            )
        )
        .filter(
            SavingsTransaction.user_id == user.id
        )
        .scalar()
    )

    # ------------------------------------------------------
    # BANK ACCOUNTS
    # ------------------------------------------------------

    bank_accounts = (
        db.query(BankAccount)
        .filter(
            BankAccount.user_id == user.id
        )
        .all()
    )

    # ------------------------------------------------------
    # BUDGETS
    # ------------------------------------------------------

    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == user.id
        )
        .all()
    )

    # ------------------------------------------------------
    # SAVINGS GOALS
    # ------------------------------------------------------

    savings_goals = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == user.id
        )
        .all()
    )

    # ------------------------------------------------------
    # PLAN
    # ------------------------------------------------------

    if user.role == "admin":

        plan = "admin"

    else:

        plan = user.plan or "normal"

    # ------------------------------------------------------
    # RETURN
    # ------------------------------------------------------

    return {

        "user": {

            "id":
                user.id,

            "username":
                user.username,

            "email":
                user.email,

            "role":
                user.role,

            "plan":
                plan,

            "verified":
                user.verified,

            "created_at":
                user.created_at,
        },

        "financial_summary": {

            "total_income":
                float(total_income or 0),

            "total_expense":
                float(total_expense or 0),

            "total_saved":
                float(total_savings or 0),

            "net_balance":
                float(total_income or 0)
                - float(total_expense or 0),
        },

        "bank_accounts": [

            {
                "id":
                    bank.id,

                "bank_name":
                    bank.bank_name,

                "account_holder":
                    bank.account_holder,

                "account_number":
                    bank.account_number,

                "ifsc_code":
                    bank.ifsc_code,

                "account_type":
                    bank.account_type,

                "current_balance":
                    float(
                        bank.current_balance or 0
                    ),

                "is_primary":
                    bank.is_primary,
            }

            for bank in bank_accounts
        ],

        "budgets": [

            {
                "id":
                    budget.id,

                "category":
                    budget.category,

                "monthly_limit":
                    float(
                        budget.monthly_limit or 0
                    ),

                "month":
                    budget.month,

                "year":
                    budget.year,

                "created_at":
                    budget.created_at,
            }

            for budget in budgets
        ],

        "savings_goals": [

            {
                "id":
                    goal.id,

                "goal_name":
                    goal.goal_name,

                "target_amount":
                    float(
                        goal.target_amount or 0
                    ),

                "current_amount":
                    float(
                        goal.current_amount or 0
                    ),
            }

            for goal in savings_goals
        ]
    }


# ==========================================================
# ADMIN CREATE USER
# ==========================================================

@router.post(
    "/users",
    status_code=status.HTTP_201_CREATED
)
def admin_create_user(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    username = (
        data.get("username") or ""
    ).strip()

    email = (
        data.get("email") or ""
    ).strip().lower()

    password = (
        data.get("password") or ""
    )

    plan = data.get(
        "plan",
        "normal"
    )

    # ------------------------------------------------------
    # VALIDATION
    # ------------------------------------------------------

    if not username:

        raise HTTPException(
            status_code=400,
            detail="Username is required"
        )

    if not email:

        raise HTTPException(
            status_code=400,
            detail="Email is required"
        )

    if not password:

        raise HTTPException(
            status_code=400,
            detail="Password is required"
        )

    if plan not in [
        "normal",
        "premium"
    ]:

        raise HTTPException(
            status_code=400,
            detail=(
                "Plan must be either "
                "'normal' or 'premium'"
            )
        )

    # ------------------------------------------------------
    # DUPLICATE CHECK
    # ------------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            (User.username == username)
            |
            (User.email == email)
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail=(
                "Username or email "
                "already exists"
            )
        )

    # ------------------------------------------------------
    # CREATE
    # ------------------------------------------------------

    new_user = User(

        username=username,

        email=email,

        password=hash_password(
            password
        ),

        role="user",

        plan=plan,

        verified=True
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return {

        "message":
            "User created successfully",

        "id":
            new_user.id,

        "username":
            new_user.username,

        "email":
            new_user.email,

        "role":
            new_user.role,

        "plan":
            new_user.plan
    }


# ==========================================================
# CHANGE USER PLAN
# ==========================================================

@router.put("/users/{user_id}/plan")
def change_user_plan(
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    # ------------------------------------------------------
    # PREVENT SELF CHANGE
    # ------------------------------------------------------

    if user_id == current_user.id:

        raise HTTPException(
            status_code=400,
            detail="You cannot change your own plan"
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # ------------------------------------------------------
    # ADMIN DOES NOT USE PLAN
    # ------------------------------------------------------

    if user.role == "admin":

        raise HTTPException(
            status_code=400,
            detail=(
                "Admin users do not have "
                "a subscription plan"
            )
        )

    plan = data.get("plan")

    if plan not in [
        "normal",
        "premium"
    ]:

        raise HTTPException(
            status_code=400,
            detail=(
                "Plan must be either "
                "'normal' or 'premium'"
            )
        )

    user.plan = plan

    db.commit()

    db.refresh(user)

    return {

        "message":
            "User plan updated successfully",

        "id":
            user.id,

        "username":
            user.username,

        "role":
            user.role,

        "plan":
            user.plan
    }


# ==========================================================
# CHANGE USER ROLE
# ==========================================================

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # BudgetBuddy has exactly one administrator account.
    # Role changes are disabled so no second admin can be created.
    raise HTTPException(
        status_code=403,
        detail="User role changes are disabled. BudgetBuddy has one administrator account."
    )


# ==========================================================
# SAVINGS GOALS FOR SYSTEM ANALYTICS
# ==========================================================

@router.get("/analytics/savings-goals")
def get_all_savings_goals_for_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    goals = (
        db.query(SavingsGoal)
        .order_by(SavingsGoal.created_at.desc())
        .all()
    )

    return [
        {
            "id": goal.id,
            "goal_name": goal.goal_name,
            "target_amount": float(goal.target_amount or 0),
            "current_amount": float(goal.current_amount or 0),
            "user_id": goal.user_id,
        }
        for goal in goals
    ]


# ==========================================================
# DELETE USER
# ==========================================================

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    # ------------------------------------------------------
    # PREVENT SELF DELETE
    # ------------------------------------------------------

    if user_id == current_user.id:

        raise HTTPException(
            status_code=400,
            detail=(
                "You cannot delete "
                "your own account"
            )
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Keep the single administrator account safe.
    if user.role == "admin":
        raise HTTPException(
            status_code=403,
            detail="The administrator account cannot be deleted."
        )

    # ------------------------------------------------------
    # DELETE SAVINGS TRANSACTIONS
    # ------------------------------------------------------

    db.query(
        SavingsTransaction
    ).filter(
        SavingsTransaction.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # ------------------------------------------------------
    # DELETE SAVINGS GOALS
    # ------------------------------------------------------

    db.query(
        SavingsGoal
    ).filter(
        SavingsGoal.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # ------------------------------------------------------
    # DELETE INCOME
    # ------------------------------------------------------

    db.query(
        Income
    ).filter(
        Income.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # ------------------------------------------------------
    # DELETE EXPENSES
    # ------------------------------------------------------

    db.query(
        Expense
    ).filter(
        Expense.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # ------------------------------------------------------
    # DELETE BUDGETS
    # ------------------------------------------------------

    db.query(
        Budget
    ).filter(
        Budget.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # ------------------------------------------------------
    # DELETE BANK ACCOUNTS
    # ------------------------------------------------------

    db.query(
        BankAccount
    ).filter(
        BankAccount.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # ------------------------------------------------------
    # DELETE USER
    # ------------------------------------------------------

    db.delete(user)

    db.commit()

    return {

        "message":
            "User and all related data "
            "deleted successfully"
    }