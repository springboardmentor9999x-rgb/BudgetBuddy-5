from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date

from app.database import get_db

from app.models import (
    SavingsGoal,
    SavingsTransaction,
    User,
    Income,
    Expense
)

from app.schemas import (
    SavingsGoalCreate,
    SavingsGoalUpdate,
    SavingsGoalResponse,
    SavingsGoalAddAmount,
)

from app.users import get_current_user


router = APIRouter(
    prefix="/savings-goals",
    tags=["Savings Goals"]
)


# ==================================================
# CREATE SAVINGS GOAL
# ==================================================

@router.post(
    "",
    response_model=SavingsGoalResponse,
    status_code=status.HTTP_201_CREATED
)
def create_goal(
    data: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    goal = SavingsGoal(
        user_id=current_user.id,
        goal_name=data.goal_name.strip(),
        target_amount=data.target_amount,
        current_amount=data.current_amount or 0
    )

    db.add(goal)
    db.commit()
    db.refresh(goal)

    return goal


# ==================================================
# GET ALL SAVINGS GOALS
# ==================================================

@router.get(
    "",
    response_model=list[SavingsGoalResponse]
)
def get_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    goals = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == current_user.id
        )
        .order_by(SavingsGoal.id.desc())
        .all()
    )

    return goals


# ==================================================
# GET AVAILABLE BALANCE
# Income - Expenses - Savings
# ==================================================

@router.get("/available-balance")
def get_available_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    total_income = (
        db.query(
            func.coalesce(func.sum(Income.amount), 0)
        )
        .filter(
            Income.user_id == current_user.id
        )
        .scalar()
    )

    total_expense = (
        db.query(
            func.coalesce(func.sum(Expense.amount), 0)
        )
        .filter(
            Expense.user_id == current_user.id
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
        .filter(
            SavingsTransaction.user_id == current_user.id
        )
        .scalar()
    )

    available_balance = (
        float(total_income)
        - float(total_expense)
        - float(total_saved)
    )

    return {
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "total_saved": float(total_saved),
        "available_balance": available_balance
    }


# ==================================================
# ADD AMOUNT TO SAVINGS GOAL
# ==================================================

@router.post(
    "/{goal_id}/add-amount",
    response_model=SavingsGoalResponse
)
def add_amount(
    goal_id: int,
    data: SavingsGoalAddAmount,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Find savings goal of current user
    goal = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.id == goal_id,
            SavingsGoal.user_id == current_user.id
        )
        .first()
    )

    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )

    # Validate amount
    if data.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0"
        )

    # Calculate total income
    total_income = (
        db.query(
            func.coalesce(func.sum(Income.amount), 0)
        )
        .filter(
            Income.user_id == current_user.id
        )
        .scalar()
    )

    # Calculate total expenses
    total_expense = (
        db.query(
            func.coalesce(func.sum(Expense.amount), 0)
        )
        .filter(
            Expense.user_id == current_user.id
        )
        .scalar()
    )

    # Calculate money already moved to savings
    total_saved = (
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
    available_balance = (
        float(total_income)
        - float(total_expense)
        - float(total_saved)
    )

    # Check sufficient balance
    if float(data.amount) > available_balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Insufficient available balance. "
                f"Available amount: ₹{available_balance:.2f}"
            )
        )

    # Add amount to savings goal
    current_amount = float(goal.current_amount or 0)

    goal.current_amount = (
        current_amount + float(data.amount)
    )

    # Create savings transaction
    transaction = SavingsTransaction(
        goal_id=goal.id,
        user_id=current_user.id,
        amount=data.amount,
        transaction_date=date.today()
    )

    db.add(transaction)
    db.commit()
    db.refresh(goal)

    return goal


# ==================================================
# GET ALL SAVINGS TRANSACTIONS
# FOR OVERALL TRANSACTIONS PAGE
# IMPORTANT: MUST COME BEFORE "/{goal_id}"
# ==================================================

@router.get("/transactions/all")
def get_all_savings_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    transactions = (
        db.query(
            SavingsTransaction,
            SavingsGoal.goal_name
        )
        .join(
            SavingsGoal,
            SavingsTransaction.goal_id == SavingsGoal.id
        )
        .filter(
            SavingsTransaction.user_id == current_user.id
        )
        .order_by(
            SavingsTransaction.transaction_date.desc(),
            SavingsTransaction.id.desc()
        )
        .all()
    )

    result = []

    for transaction, goal_name in transactions:

        result.append({
            "id": transaction.id,
            "goal_id": transaction.goal_id,
            "goal_name": goal_name,
            "amount": float(transaction.amount),
            "transaction_date": transaction.transaction_date,
            "created_at": transaction.created_at,
            "type": "Savings"
        })

    return result


# ==================================================
# GET SAVINGS GOAL HISTORY
# ==================================================

@router.get("/{goal_id}/history")
def get_goal_history(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Verify goal belongs to current user
    goal = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.id == goal_id,
            SavingsGoal.user_id == current_user.id
        )
        .first()
    )

    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )

    transactions = (
        db.query(SavingsTransaction)
        .filter(
            SavingsTransaction.goal_id == goal_id,
            SavingsTransaction.user_id == current_user.id
        )
        .order_by(
            SavingsTransaction.transaction_date.desc(),
            SavingsTransaction.id.desc()
        )
        .all()
    )

    result = []

    for transaction in transactions:

        result.append({
            "id": transaction.id,
            "goal_id": transaction.goal_id,
            "amount": float(transaction.amount),
            "transaction_date": transaction.transaction_date,
            "created_at": transaction.created_at
        })

    return result


# ==================================================
# GET ONE SAVINGS GOAL
# IMPORTANT: MUST COME AFTER FIXED ROUTES
# ==================================================

@router.get(
    "/{goal_id}",
    response_model=SavingsGoalResponse
)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    goal = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.id == goal_id,
            SavingsGoal.user_id == current_user.id
        )
        .first()
    )

    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )

    return goal


# ==================================================
# UPDATE SAVINGS GOAL
# ==================================================

@router.put(
    "/{goal_id}",
    response_model=SavingsGoalResponse
)
def update_goal(
    goal_id: int,
    data: SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    goal = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.id == goal_id,
            SavingsGoal.user_id == current_user.id
        )
        .first()
    )

    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )

    if not data.goal_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Goal name cannot be empty"
        )

    if data.target_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target amount must be greater than 0"
        )

    if data.current_amount < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current amount cannot be negative"
        )

    goal.goal_name = data.goal_name.strip()
    goal.target_amount = data.target_amount
    goal.current_amount = data.current_amount

    db.commit()
    db.refresh(goal)

    return goal


# ==================================================
# DELETE SAVINGS GOAL
# ==================================================

@router.delete(
    "/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    goal = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.id == goal_id,
            SavingsGoal.user_id == current_user.id
        )
        .first()
    )

    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )

    # Delete related savings transactions first
    db.query(SavingsTransaction).filter(
        SavingsTransaction.goal_id == goal_id,
        SavingsTransaction.user_id == current_user.id
    ).delete(
        synchronize_session=False
    )

    # Delete goal
    db.delete(goal)
    db.commit()

    return None