from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user
from app.models import User, Profile, UserRole
from app.schemas.schemas import UserCreate, UserOut, Token, OAuthLoginRequest, VerifyEmailRequest, ResendVerificationRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.services.notification_service import create_notification, log_system_action
from app.services.email_service import generate_otp_code, send_verification_email

router = APIRouter()

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    otp_code = generate_otp_code()
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    hashed_pwd = get_password_hash(user_in.password)

    smtp_enabled = bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_USER"))

    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_pwd,
        role=user_in.role if user_in.role in [r.value for r in UserRole] else UserRole.STUDENT.value,
        is_email_verified=True if not smtp_enabled else False,
        verification_code=otp_code,
        verification_code_expires_at=expires_at
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create associated default profile
    profile = Profile(
        user_id=new_user.id,
        monthly_income_target=1000.0,
        preferred_currency="USD"
    )
    db.add(profile)

    # Create welcome notification
    create_notification(
        db=db,
        user_id=new_user.id,
        title="Welcome to BudgetBuddy!",
        message="Start managing your daily expenses, setting monthly budgets, and working towards your savings goals.",
        notification_type="system"
    )

    # Send Gmail / Email verification OTP safely
    try:
        send_verification_email(new_user.email, otp_code)
    except Exception:
        pass

    log_system_action(db=db, user_id=new_user.id, action="User Registered", details=f"Role: {new_user.role}")
    db.commit()
    user_to_return = db.query(User).filter(User.id == new_user.id).first()
    return user_to_return

@router.post("/verify-email", response_model=Token)
def verify_email(req: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_email_verified:
        # Already verified
        access_token = create_access_token(subject=user.id)
        return {"access_token": access_token, "token_type": "bearer", "user": user}

    if user.verification_code != req.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if user.verification_code_expires_at and datetime.utcnow() > user.verification_code_expires_at:
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new code.")

    user.is_email_verified = True
    user.verification_code = None
    user.verification_code_expires_at = None
    db.commit()
    db.refresh(user)

    log_system_action(db=db, user_id=user.id, action="Email Verified Successfully")
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/resend-verification")
def resend_verification(req: ResendVerificationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_email_verified:
        return {"message": "Email is already verified"}

    otp_code = generate_otp_code()
    expires_at = datetime.utcnow() + timedelta(minutes=15)

    user.verification_code = otp_code
    user.verification_code_expires_at = expires_at
    db.commit()

    send_verification_email(user.email, otp_code)
    return {"message": f"New verification code sent to {user.email}"}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        # For security, do not disclose if email doesn't exist
        return {"message": f"If an account with {req.email} exists, a 6-digit password reset code has been sent."}

    otp_code = generate_otp_code()
    expires_at = datetime.utcnow() + timedelta(minutes=15)

    user.verification_code = otp_code
    user.verification_code_expires_at = expires_at
    db.commit()

    send_verification_email(user.email, otp_code)
    log_system_action(db=db, user_id=user.id, action="Password Reset Code Requested")
    return {"message": f"A 6-digit password reset code has been emailed to {user.email}."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    if not user.verification_code or user.verification_code != req.code:
        raise HTTPException(status_code=400, detail="Invalid 6-digit reset code")

    if user.verification_code_expires_at and datetime.utcnow() > user.verification_code_expires_at:
        raise HTTPException(status_code=400, detail="Password reset code has expired. Please request a new code.")

    # Update password
    user.hashed_password = get_password_hash(req.new_password)
    user.verification_code = None
    user.verification_code_expires_at = None
    user.is_email_verified = True # Auto verify email on password reset
    db.commit()

    create_notification(
        db=db,
        user_id=user.id,
        title="Password Changed",
        message="Your BudgetBuddy password was changed successfully.",
        notification_type="system"
    )
    log_system_action(db=db, user_id=user.id, action="Password Reset Successfully")
    return {"message": "Password reset successfully! You can now log in with your new password."}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")

    if not user.is_email_verified:
        raise HTTPException(
            status_code=400,
            detail="Email address not verified. Please verify your email first."
        )

    access_token = create_access_token(subject=user.id)
    log_system_action(db=db, user_id=user.id, action="User Login", details="Standard Login")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/oauth/login", response_model=Token)
def oauth_login(oauth_in: OAuthLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == oauth_in.email).first()
    if not user:
        # Auto register OAuth user with is_email_verified=True
        hashed_pwd = get_password_hash(f"oauth_{oauth_in.provider_id}")
        user = User(
            email=oauth_in.email,
            full_name=oauth_in.full_name,
            hashed_password=hashed_pwd,
            role=UserRole.STUDENT.value,
            is_email_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = Profile(user_id=user.id, monthly_income_target=1000.0)
        db.add(profile)
        create_notification(
            db=db,
            user_id=user.id,
            title=f"Welcome via {oauth_in.provider.capitalize()}!",
            message="Your OAuth account has been connected successfully.",
            notification_type="system"
        )
        db.commit()
    else:
        user.is_email_verified = True
        db.commit()

    access_token = create_access_token(subject=user.id)
    log_system_action(db=db, user_id=user.id, action="OAuth Login", details=f"Provider: {oauth_in.provider}")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.delete("/me", status_code=status.HTTP_200_OK)
def delete_current_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.id
    email = current_user.email

    # Delete all associated records
    from app.models import Profile, Income, Expense, Budget, SavingsGoal, Notification, SystemLog
    db.query(Profile).filter(Profile.user_id == user_id).delete()
    db.query(Income).filter(Income.user_id == user_id).delete()
    db.query(Expense).filter(Expense.user_id == user_id).delete()
    db.query(Budget).filter(Budget.user_id == user_id).delete()
    db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).delete()
    db.query(Notification).filter(Notification.user_id == user_id).delete()
    db.query(SystemLog).filter(SystemLog.user_id == user_id).delete()
    
    # Delete user account
    db.delete(current_user)
    db.commit()

    return {"message": f"Account {email} has been permanently deleted"}

