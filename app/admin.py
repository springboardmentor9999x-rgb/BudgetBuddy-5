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


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# ==================================================
# ADMIN DASHBOARD SUMMARY
# ==================================================

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


# ==================================================
# GET ALL USERS
# ==================================================

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

        bank_accounts_count = (
            db.query(BankAccount)
            .filter(
                BankAccount.user_id == user.id
            )
            .count()
        )

        budgets_count = (
            db.query(Budget)
            .filter(
                Budget.user_id == user.id
            )
            .count()
        )

        savings_goals_count = (
            db.query(SavingsGoal)
            .filter(
                SavingsGoal.user_id == user.id
            )
            .count()
        )

        # Admin does not have a subscription plan
        if user.role == "admin":
            plan = "admin"
        else:
            plan = user.plan or "normal"

        result.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "plan": plan,
            "verified": user.verified,
            "created_at": user.created_at,

            "total_income": float(
                total_income or 0
            ),

            "total_expense": float(
                total_expense or 0
            ),

            "bank_accounts_count":
                bank_accounts_count,

            "budgets_count":
                budgets_count,

            "savings_goals_count":
                savings_goals_count,
        })

    return result


# ==================================================
# GET ONE USER - COMPLETE DETAILS
# ==================================================

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

    bank_accounts = (
        db.query(BankAccount)
        .filter(
            BankAccount.user_id == user.id
        )
        .all()
    )

    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == user.id
        )
        .all()
    )

    savings_goals = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == user.id
        )
        .all()
    )

    if user.role == "admin":
        plan = "admin"
    else:
        plan = user.plan or "normal"

    return {

        "user": {

            "id": user.id,

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


# ==================================================
# ADMIN CREATE USER
# ==================================================

@router.post(
    "/users",
    status_code=status.HTTP_201_CREATED
)
def admin_create_user(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    plan = data.get(
        "plan",
        "normal"
    )

    if not username or not email or not password:
        raise HTTPException(
            status_code=400,
            detail=(
                "Username, email and password "
                "are required"
            )
        )

    # Only normal and premium are allowed
    if plan not in ["normal", "premium"]:
        raise HTTPException(
            status_code=400,
            detail=(
                "Plan must be either "
                "'normal' or 'premium'"
            )
        )

    existing_user = (
        db.query(User)
        .filter(
            (User.username == username) |
            (User.email == email)
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail=(
                "Username or email already exists"
            )
        )

    new_user = User(
        username=username,
        email=email,
        password=hash_password(password),

        # Admin-created accounts are normal users
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


# ==================================================
# CHANGE USER PLAN
# ==================================================

@router.put("/users/{user_id}/plan")
def change_user_plan(
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    # Admin cannot change their own plan
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

    # Admin accounts don't use subscription plans
    if user.role == "admin":
        raise HTTPException(
            status_code=400,
            detail=(
                "Admin users do not have "
                "a subscription plan"
            )
        )

    plan = data.get("plan")

    if plan not in ["normal", "premium"]:
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


# ==================================================
# CHANGE USER ROLE
# ==================================================

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    # Prevent admin from changing their own role
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role"
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

    role = data.get("role")

    if role not in ["user", "admin"]:
        raise HTTPException(
            status_code=400,
            detail=(
                "Role must be either "
                "'user' or 'admin'"
            )
        )

    user.role = role

    # If converted to admin,
    # subscription plan is removed
    if role == "admin":
        user.plan = "normal"

    # If converted back to normal user,
    # give normal plan by default
    elif role == "user":
        user.plan = user.plan or "normal"

    db.commit()
    db.refresh(user)

    return {

        "message":
            "User role updated successfully",

        "id":
            user.id,

        "username":
            user.username,

        "role":
            user.role,

        "plan":
            "admin"
            if user.role == "admin"
            else user.plan
    }


# ==================================================
# DELETE USER
# ==================================================

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    # Prevent admin from deleting themselves
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

    # ------------------------------------------
    # Delete savings transactions
    # ------------------------------------------

    db.query(
        SavingsTransaction
    ).filter(
        SavingsTransaction.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # ------------------------------------------
    # Delete savings goals
    # ------------------------------------------

    db.query(
        SavingsGoal
    ).filter(
        SavingsGoal.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # ------------------------------------------
    # Delete income
    # ------------------------------------------

    db.query(
        Income
    ).filter(
        Income.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # ------------------------------------------
    # Delete expenses
    # ------------------------------------------

    db.query(
        Expense
    ).filter(
        Expense.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # ------------------------------------------
    # Delete budgets
    # ------------------------------------------

    db.query(
        Budget
    ).filter(
        Budget.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # ------------------------------------------
    # Delete bank accounts
    # ------------------------------------------

    db.query(
        BankAccount
    ).filter(
        BankAccount.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # ------------------------------------------
    # Finally delete user
    # ------------------------------------------

    db.delete(user)

    db.commit()

    return {
        "message":
            "User and all related data "
            "deleted successfully"
    }