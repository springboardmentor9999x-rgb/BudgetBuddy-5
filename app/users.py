from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import (
    OAuth2PasswordBearer,
    OAuth2PasswordRequestForm
)
from sqlalchemy.orm import Session
from sqlalchemy import or_

from datetime import datetime, timedelta
import random

from app.database import get_db
from app.models import User

from app.schemas import (
    UserCreate,
    UserResponse,
    OTPVerify,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    Token,
)

from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

from app.email_utils import send_otp_email


# ==================================================
# ROUTER
# ==================================================

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ==================================================
# JWT TOKEN
# ==================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


# ==================================================
# REGISTER NEW USER
# ==================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    username = user.username.strip()
    email = user.email.lower().strip()

    existing_user = (
        db.query(User)
        .filter(
            or_(
                User.username == username,
                User.email == email
            )
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or Email already exists"
        )

    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))

    # OTP expires in 10 minutes
    expiry = datetime.utcnow() + timedelta(minutes=10)

    new_user = User(
        username=username,
        email=email,
        password=hash_password(user.password),

        # Public users cannot create admin accounts
        role="user",

        verified=False,
        verification_code=otp,
        verification_code_expires_at=expiry
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send OTP to registered email
    send_otp_email(
        new_user.email,
        otp
    )

    return new_user


# ==================================================
# VERIFY EMAIL OTP
# ==================================================

@router.post("/verify-otp")
def verify_otp(
    data: OTPVerify,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(
            User.email == data.email.lower().strip()
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.verified:
        return {
            "message": "Email is already verified"
        }

    if user.verification_code != data.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )

    if (
        user.verification_code_expires_at is None
        or datetime.utcnow() > user.verification_code_expires_at
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired"
        )

    user.verified = True
    user.verification_code = None
    user.verification_code_expires_at = None

    db.commit()
    db.refresh(user)

    return {
        "message": "Email verified successfully"
    }


# ==================================================
# RESEND VERIFICATION OTP
# ==================================================

@router.post("/resend-otp/{email}")
def resend_otp(
    email: str,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(
            User.email == email.lower().strip()
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified"
        )

    otp = str(random.randint(100000, 999999))

    user.verification_code = otp
    user.verification_code_expires_at = (
        datetime.utcnow() +
        timedelta(minutes=10)
    )

    db.commit()

    send_otp_email(
        user.email,
        otp
    )

    return {
        "message": "OTP sent successfully"
    }


# ==================================================
# LOGIN
# LOGIN USING USERNAME OR EMAIL
# IMPORTANT:
# OAuth2PasswordRequestForm requires:
# username = username OR email
# password = password
# ==================================================

@router.post(
    "/login",
    response_model=Token
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    login_value = form_data.username.strip()

    # User can enter either username or email
    user = (
        db.query(User)
        .filter(
            or_(
                User.username == login_value,
                User.email == login_value.lower()
            )
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password"
        )

    if not verify_password(
        form_data.password,
        user.password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password"
        )

    if not user.verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email first"
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "username": user.username,
            "role": user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ==================================================
# FORGOT PASSWORD
# SEND RESET OTP
# ==================================================

@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):

    email = data.email.lower().strip()

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    # Do not reveal whether email exists
    if not user:
        return {
            "message": (
                "If this email is registered, "
                "a reset code has been sent"
            )
        }

    otp = str(random.randint(100000, 999999))

    user.verification_code = otp
    user.verification_code_expires_at = (
        datetime.utcnow() +
        timedelta(minutes=10)
    )

    db.commit()

    send_otp_email(
        user.email,
        otp
    )

    return {
        "message": "Password reset OTP sent to your email"
    }


# ==================================================
# RESET PASSWORD
# ==================================================

@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(
            User.email == data.email.lower().strip()
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.verification_code != data.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )

    if (
        user.verification_code_expires_at is None
        or datetime.utcnow() > user.verification_code_expires_at
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired"
        )

    user.password = hash_password(
        data.new_password
    )

    # Remove used OTP
    user.verification_code = None
    user.verification_code_expires_at = None

    db.commit()
    db.refresh(user)

    return {
        "message": "Password reset successfully"
    }


# ==================================================
# GET CURRENT USER FROM JWT
# ==================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user


# ==================================================
# GET CURRENT USER PROFILE
# ==================================================

@router.get(
    "/me",
    response_model=UserResponse
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user


# ==================================================
# REQUIRE ADMIN
# ==================================================

def require_admin(
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user