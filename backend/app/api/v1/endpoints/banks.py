from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, BankAccount
from app.schemas.schemas import BankAccountCreate, BankAccountUpdate, BankAccountOut
from app.services.notification_service import create_notification, log_system_action

router = APIRouter()

@router.get("/", response_model=List[BankAccountOut])
def get_bank_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(BankAccount).filter(BankAccount.user_id == current_user.id).order_by(BankAccount.is_primary.desc(), BankAccount.created_at.desc()).all()

@router.post("/", response_model=BankAccountOut, status_code=status.HTTP_201_CREATED)
def create_bank_account(
    bank_in: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # If set as primary, unset other primary accounts
    if bank_in.is_primary:
        db.query(BankAccount).filter(BankAccount.user_id == current_user.id).update({"is_primary": False})

    new_bank = BankAccount(
        user_id=current_user.id,
        account_name=bank_in.account_name,
        bank_name=bank_in.bank_name,
        account_type=bank_in.account_type,
        account_number_last4=bank_in.account_number_last4,
        current_balance=bank_in.current_balance,
        currency=bank_in.currency,
        is_primary=bank_in.is_primary,
        color_gradient=bank_in.color_gradient or "from-blue-600 to-indigo-800"
    )
    db.add(new_bank)
    db.commit()
    db.refresh(new_bank)

    create_notification(
        db=db,
        user_id=current_user.id,
        title="Bank Account Linked",
        message=f"Successfully linked {bank_in.bank_name} ({bank_in.account_name}) with balance ${bank_in.current_balance:,.2f}.",
        notification_type="system"
    )
    log_system_action(db=db, user_id=current_user.id, action="Link Bank Account", details=f"{bank_in.bank_name} - {bank_in.account_name}")
    db.commit()
    return new_bank

@router.put("/{bank_id}", response_model=BankAccountOut)
def update_bank_account(
    bank_id: int,
    bank_in: BankAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bank = db.query(BankAccount).filter(BankAccount.id == bank_id, BankAccount.user_id == current_user.id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank account not found")

    update_data = bank_in.model_dump(exclude_unset=True)

    if update_data.get("is_primary"):
        db.query(BankAccount).filter(BankAccount.user_id == current_user.id).update({"is_primary": False})

    for field, val in update_data.items():
        setattr(bank, field, val)

    db.commit()
    db.refresh(bank)
    return bank

@router.delete("/{bank_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bank_account(
    bank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bank = db.query(BankAccount).filter(BankAccount.id == bank_id, BankAccount.user_id == current_user.id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank account not found")

    db.delete(bank)
    db.commit()
    return None
