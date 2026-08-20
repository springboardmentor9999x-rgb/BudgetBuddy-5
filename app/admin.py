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

from app.users import get_current_user, require_admin
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
        .filter(User.role == "user")
        .count()
    )

    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "normal_users": normal_users
    }


# ==================================================
# GET ALL USERS WITH FINANCIAL SUMMARY
# ==================================================

@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    users = db.query(User).order_by(User.id.desc()).all()

    result = []

    for user in users:

        total_income = (
            db.query(func.coalesce(func.sum(Income.amount), 0))
            .filter(Income.user_id == user.id)
            .scalar()
        )

        total_expense = (
            db.query(func.coalesce(func.sum(Expense.amount), 0))
            .filter(Expense.user_id == user.id)
            .scalar()
        )

        bank_accounts_count = (
            db.query(BankAccount)
            .filter(BankAccount.user_id == user.id)
            .count()
        )

        budgets_count = (
            db.query(Budget)
            .filter(Budget.user_id == user.id)
            .count()
        )

        savings_goals_count = (
            db.query(SavingsGoal)
            .filter(SavingsGoal.user_id == user.id)
            .count()
        )

        result.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "verified": user.verified,
            "created_at": user.created_at,
            "total_income": float(total_income),
            "total_expense": float(total_expense),
            "bank_accounts_count": bank_accounts_count,
            "budgets_count": budgets_count,
            "savings_goals_count": savings_goals_count,
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
        db.query(func.coalesce(func.sum(Income.amount), 0))
        .filter(Income.user_id == user.id)
        .scalar()
    )

    total_expense = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.user_id == user.id)
        .scalar()
    )

    total_savings = (
        db.query(
            func.coalesce(
                func.sum(SavingsTransaction.amount),
                0
            )
        )
        .filter(SavingsTransaction.user_id == user.id)
        .scalar()
    )

    bank_accounts = (
        db.query(BankAccount)
        .filter(BankAccount.user_id == user.id)
        .all()
    )

    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == user.id)
        .all()
    )

    savings_goals = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.user_id == user.id)
        .all()
    )

    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "verified": user.verified,
            "created_at": user.created_at,
        },

        "financial_summary": {
            "total_income": float(total_income),
            "total_expense": float(total_expense),
            "total_saved": float(total_savings),
            "net_balance": float(total_income) - float(total_expense),
        },

        "bank_accounts": [
            {
                "id": bank.id,
                "bank_name": bank.bank_name,
                "account_holder": bank.account_holder,
                "account_number": bank.account_number,
                "ifsc_code": bank.ifsc_code,
                "account_type": bank.account_type,
                "current_balance": float(bank.current_balance or 0),
                "is_primary": bank.is_primary,
            }
            for bank in bank_accounts
        ],

        "budgets": [
            {
                "id": budget.id,
                "category": budget.category,
                "monthly_limit": float(budget.monthly_limit),
                "month": budget.month,
                "year": budget.year,
                "created_at": budget.created_at,
            }
            for budget in budgets
        ],

        "savings_goals": [
            {
                "id": goal.id,
                "goal_name": goal.goal_name,
                "target_amount": float(goal.target_amount),
                "current_amount": float(goal.current_amount or 0),
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

    if not username or not email or not password:
        raise HTTPException(
            status_code=400,
            detail="Username, email and password are required"
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
            detail="Username or email already exists"
        )

    new_user = User(
        username=username,
        email=email,
        password=hash_password(password),
        role="user",
        verified=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully",
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email
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

    # Prevent admin from deleting their own account
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own account"
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

    # Delete savings transactions first
    db.query(SavingsTransaction).filter(
        SavingsTransaction.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # Delete savings goals
    db.query(SavingsGoal).filter(
        SavingsGoal.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # Delete income
    db.query(Income).filter(
        Income.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # Delete expenses
    db.query(Expense).filter(
        Expense.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # Delete budgets
    db.query(Budget).filter(
        Budget.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # Delete bank accounts
    db.query(BankAccount).filter(
        BankAccount.user_id == user_id
    ).delete(
        synchronize_session=False
    )

    # Finally delete user
    db.delete(user)

    db.commit()

    return {
        "message": "User and all related data deleted successfully"
    }