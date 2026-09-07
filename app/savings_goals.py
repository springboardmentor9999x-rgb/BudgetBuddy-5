from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db

from app.models import (
    SavingsGoal,
    SavingsTransaction,
    Income,
    Expense,
    User,
    Notification,
    BankAccount,
)

from app.schemas import (
    SavingsGoalCreate,
    SavingsGoalUpdate,
    SavingsGoalResponse,
    SavingsGoalAddAmount,
    SavingsTransactionResponse,
)

from app.users import get_current_user


router = APIRouter(
    prefix="/savings-goals",
    tags=["Savings Goals"]
)


# ==========================================================
# CREATE SAVINGS GOAL
# ==========================================================

@router.post(
    "",
    response_model=SavingsGoalResponse,
    status_code=status.HTTP_201_CREATED
)
def create_savings_goal(
    goal_data: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ------------------------------------------------------
    # CHECK BANK ACCOUNT
    # ------------------------------------------------------

    bank_account = (
        db.query(BankAccount)
        .filter(
            BankAccount.id == goal_data.bank_account_id,
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
    # CREATE GOAL
    # ------------------------------------------------------

    new_goal = SavingsGoal(
        user_id=current_user.id,
        goal_name=goal_data.goal_name,
        target_amount=goal_data.target_amount,
        current_amount=goal_data.current_amount,
        bank_account_id=goal_data.bank_account_id
    )

    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)

    # ------------------------------------------------------
    # NOTIFICATION
    # ------------------------------------------------------

    notification = Notification(
        user_id=current_user.id,
        message=(
            f"Savings goal '{new_goal.goal_name}' "
            f"created successfully for "
            f"{bank_account.bank_name}."
        ),
        notification_type="savings"
    )

    db.add(notification)
    db.commit()

    return new_goal


# ==========================================================
# GET ALL SAVINGS GOALS
# ==========================================================

@router.get(
    "",
    response_model=list[SavingsGoalResponse]
)
def get_all_savings_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    goals = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == current_user.id
        )
        .order_by(
            SavingsGoal.created_at.desc()
        )
        .all()
    )

    return goals

# ==========================================================
# GET SAVINGS GOAL HISTORY
# ==========================================================

@router.get(
    "/{goal_id}/history",
    response_model=list[SavingsTransactionResponse]
)
def get_goal_history(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ------------------------------------------------------
    # CHECK THAT THE GOAL BELONGS TO THE CURRENT USER
    # ------------------------------------------------------

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

    # ------------------------------------------------------
    # GET SAVINGS TRANSACTIONS
    # ------------------------------------------------------

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

    return transactions
# ==========================================================
# GET SINGLE SAVINGS GOAL
# ==========================================================

@router.get(
    "/{goal_id}",
    response_model=SavingsGoalResponse
)
def get_savings_goal(
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
            status_code=404,
            detail="Savings goal not found"
        )

    return goal


# ==========================================================
# ADD MONEY TO SAVINGS GOAL
# ==========================================================

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

    # ------------------------------------------------------
    # VALIDATE AMOUNT
    # ------------------------------------------------------

    if float(data.amount) <= 0:
        raise HTTPException(
            status_code=400,
            detail="Savings amount must be greater than zero"
        )

    # ------------------------------------------------------
    # FIND GOAL
    # ------------------------------------------------------

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
            status_code=404,
            detail="Savings goal not found"
        )

    # ------------------------------------------------------
    # CHECK LINKED BANK
    # ------------------------------------------------------

    if goal.bank_account_id is None:
        raise HTTPException(
            status_code=400,
            detail="This savings goal is not linked to a bank account"
        )

    bank_account = (
        db.query(BankAccount)
        .filter(
            BankAccount.id == goal.bank_account_id,
            BankAccount.user_id == current_user.id
        )
        .first()
    )

    if bank_account is None:
        raise HTTPException(
            status_code=404,
            detail="Linked bank account not found"
        )

    amount = float(data.amount)

    # ------------------------------------------------------
    # CHECK ACTUAL BANK BALANCE
    # ------------------------------------------------------

    current_bank_balance = float(
        bank_account.current_balance or 0
    )

    if amount > current_bank_balance:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient balance in "
                f"{bank_account.bank_name}. "
                f"Available amount: "
                f"₹{current_bank_balance:.2f}"
            )
        )

    # ------------------------------------------------------
    # OLD GOAL AMOUNT
    # ------------------------------------------------------

    old_amount = float(
        goal.current_amount or 0
    )

    # ------------------------------------------------------
    # CHECK TARGET
    # ------------------------------------------------------

    target_amount = float(
        goal.target_amount
    )

    if old_amount >= target_amount:
        raise HTTPException(
            status_code=400,
            detail="This savings goal has already been reached"
        )

    # ------------------------------------------------------
    # CHECK THAT NEW SAVINGS DOES NOT EXCEED TARGET
    # ------------------------------------------------------

    if old_amount + amount > target_amount:
        remaining_amount = target_amount - old_amount

        raise HTTPException(
            status_code=400,
            detail=(
                f"You can add only ₹{remaining_amount:.2f} "
                f"to reach this savings goal."
            )
        )

    # ------------------------------------------------------
    # ADD MONEY TO GOAL
    # ------------------------------------------------------

    new_amount = old_amount + amount

    goal.current_amount = new_amount

    # ------------------------------------------------------
    # DEDUCT MONEY FROM BANK
    # ------------------------------------------------------

    bank_account.current_balance = (
        current_bank_balance - amount
    )

    # ------------------------------------------------------
    # CREATE SAVINGS TRANSACTION
    # ------------------------------------------------------

    transaction = SavingsTransaction(
        goal_id=goal.id,
        user_id=current_user.id,
        bank_account_id=goal.bank_account_id,
        amount=data.amount,
        transaction_date=date.today()
    )

    db.add(transaction)

    # ------------------------------------------------------
    # SAVINGS NOTIFICATION
    # ------------------------------------------------------

    add_notification = Notification(
        user_id=current_user.id,
        message=(
            f"₹{amount:.2f} added to "
            f"your savings goal '{goal.goal_name}' "
            f"from {bank_account.bank_name}."
        ),
        notification_type="savings"
    )

    db.add(add_notification)

    # ------------------------------------------------------
    # CHECK WHETHER GOAL WAS REACHED
    # ------------------------------------------------------

    if (
        old_amount < target_amount
        and new_amount >= target_amount
    ):

        goal_reached_notification = Notification(
            user_id=current_user.id,
            message=(
                f"Congratulations! You reached your "
                f"savings goal '{goal.goal_name}' "
                f"of ₹{target_amount:.2f}!"
            ),
            notification_type="success"
        )

        db.add(goal_reached_notification)

    # ------------------------------------------------------
    # SAVE EVERYTHING
    # ------------------------------------------------------

    db.commit()
    db.refresh(goal)

    return goal


# ==========================================================
# GET SAVINGS TRANSACTIONS
# ==========================================================

@router.get(
    "/{goal_id}/transactions",
    response_model=list[SavingsTransactionResponse]
)
def get_savings_transactions(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ------------------------------------------------------
    # CHECK GOAL
    # ------------------------------------------------------

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
            status_code=404,
            detail="Savings goal not found"
        )

    # ------------------------------------------------------
    # GET TRANSACTIONS
    # ------------------------------------------------------

    transactions = (
        db.query(SavingsTransaction)
        .filter(
            SavingsTransaction.goal_id == goal_id,
            SavingsTransaction.user_id == current_user.id
        )
        .order_by(
            SavingsTransaction.created_at.desc()
        )
        .all()
    )

    return transactions


# ==========================================================
# UPDATE SAVINGS GOAL
# ==========================================================

@router.put(
    "/{goal_id}",
    response_model=SavingsGoalResponse
)
def update_savings_goal(
    goal_id: int,
    goal_data: SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ------------------------------------------------------
    # FIND GOAL
    # ------------------------------------------------------

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
            status_code=404,
            detail="Savings goal not found"
        )

    # ------------------------------------------------------
    # IMPORTANT:
    # DO NOT ALLOW CURRENT_AMOUNT TO BE CHANGED MANUALLY
    # ------------------------------------------------------

    existing_saved_amount = float(
        goal.current_amount or 0
    )

    # ------------------------------------------------------
    # CHECK NEW BANK
    # ------------------------------------------------------

    bank_account = (
        db.query(BankAccount)
        .filter(
            BankAccount.id == goal_data.bank_account_id,
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
    # DO NOT MOVE SAVED MONEY WHEN CHANGING BANK
    #
    # If the goal already has savings transactions,
    # changing the linked bank would make the accounting
    # inconsistent.
    # ------------------------------------------------------

    if (
        goal.bank_account_id != goal_data.bank_account_id
        and existing_saved_amount > 0
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Bank account cannot be changed after "
                "money has been added to this savings goal. "
                "Create a new savings goal for another bank."
            )
        )

    # ------------------------------------------------------
    # UPDATE GOAL DETAILS
    # ------------------------------------------------------

    goal.goal_name = goal_data.goal_name
    goal.target_amount = goal_data.target_amount

    # Keep actual saved amount unchanged
    goal.current_amount = existing_saved_amount

    goal.bank_account_id = goal_data.bank_account_id

    db.commit()
    db.refresh(goal)

    return goal


# ==========================================================
# DELETE SAVINGS GOAL
# ==========================================================

@router.delete(
    "/{goal_id}"
)
def delete_savings_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ------------------------------------------------------
    # FIND GOAL
    # ------------------------------------------------------

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
            status_code=404,
            detail="Savings goal not found"
        )

    # ------------------------------------------------------
    # CALCULATE TOTAL SAVED FOR THIS GOAL
    # ------------------------------------------------------

    total_saved = (
        db.query(
            func.coalesce(
                func.sum(SavingsTransaction.amount),
                0
            )
        )
        .filter(
            SavingsTransaction.goal_id == goal_id,
            SavingsTransaction.user_id == current_user.id
        )
        .scalar()
    )

    total_saved = float(total_saved or 0)

    # ------------------------------------------------------
    # RESTORE MONEY TO BANK
    # ------------------------------------------------------

    if (
        goal.bank_account_id is not None
        and total_saved > 0
    ):

        bank_account = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == goal.bank_account_id,
                BankAccount.user_id == current_user.id
            )
            .first()
        )

        if bank_account is not None:

            bank_account.current_balance = (
                float(bank_account.current_balance or 0)
                + total_saved
            )

    # ------------------------------------------------------
    # DELETE SAVINGS TRANSACTIONS
    # ------------------------------------------------------

    db.query(
        SavingsTransaction
    ).filter(
        SavingsTransaction.goal_id == goal_id,
        SavingsTransaction.user_id == current_user.id
    ).delete(
        synchronize_session=False
    )

    # ------------------------------------------------------
    # DELETE GOAL
    # ------------------------------------------------------

    db.delete(goal)

    # ------------------------------------------------------
    # NOTIFICATION
    # ------------------------------------------------------

    if total_saved > 0:

        notification = Notification(
            user_id=current_user.id,
            message=(
                f"Savings goal deleted successfully. "
                f"₹{total_saved:.2f} was returned to "
                f"your bank account."
            ),
            notification_type="savings"
        )

        db.add(notification)

    db.commit()

    return {
        "message": "Savings goal deleted successfully",
        "amount_returned": total_saved
    }