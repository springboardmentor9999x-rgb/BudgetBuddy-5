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

from app.users import require_admin
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
# SYSTEM DETAILS
# ==========================================================

@router.get("/system-details")
def get_system_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin-only system information.

    This endpoint intentionally returns system-level counts and security
    status only. It does NOT return any user's personal financial amounts.
    """

    total_users = db.query(User).count()

    admin_users = (
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

    premium_percentage = (
        round((premium_users / total_users) * 100, 2)
        if total_users
        else 0
    )

    return {
        "application": {
            "name": "BudgetBuddy",
            "architecture": "React + FastAPI + PostgreSQL",
            "authentication": "JWT Authentication",
            "access_control": "Role-Based Access Control",
            "status": "Operational",
        },

        "users": {
            "total": total_users,
            "admins": admin_users,
            "normal": normal_users,
            "premium": premium_users,
            "verified": verified_users,
            "unverified": unverified_users,
            "premium_percentage": premium_percentage,
        },

        "system": {
            "bank_accounts": db.query(BankAccount).count(),
            "budgets": db.query(Budget).count(),
            "savings_goals": db.query(SavingsGoal).count(),
            "income_records": db.query(Income).count(),
            "expense_records": db.query(Expense).count(),
            "savings_transactions": db.query(SavingsTransaction).count(),
        },

        "security": {
            "jwt_authentication": True,
            "role_based_access": True,
            "admin_protection": True,
            "user_data_isolation": True,
            "private_financial_data": True,
        },
    }


# ==========================================================
# ==========================================================
# GET ALL USERS
# ==========================================================

@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin-only user list.

    IMPORTANT:
    No financial information is returned here.
    User income, expenses, balances, budgets and savings are private.
    """

    users = (
        db.query(User)
        .order_by(User.id.desc())
        .all()
    )

    result = []

    for user in users:
        result.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "plan": "admin" if user.role == "admin" else (user.plan or "normal"),
            "verified": user.verified,
            "created_at": user.created_at,
        })

    return result


# ==========================================================
# GET ONE USER - PUBLIC ACCOUNT METADATA FOR ADMIN
# ==========================================================

# ==========================================================
# GET ONE USER - COMPLETE DETAILS
# ==========================================================

@router.get("/users/{user_id}")
def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Return account metadata only.

    Financial information is intentionally excluded to protect user privacy.
    """

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

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "plan": "admin" if user.role == "admin" else (user.plan or "normal"),
        "verified": user.verified,
        "created_at": user.created_at,
    }


# ==========================================================
# ADMIN CREATE USER
# ==========================================================

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