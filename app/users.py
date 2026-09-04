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


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ============================================================
# OAUTH2
# ============================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


# ============================================================
# REGISTER
# ============================================================

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

    # --------------------------------------------------------
    # Check existing username/email
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Generate OTP
    # --------------------------------------------------------

    otp = str(random.randint(100000, 999999))

    expiry = (
        datetime.utcnow()
        + timedelta(minutes=10)
    )

    # --------------------------------------------------------
    # CREATE USER
    #
    # Every newly registered account:
    # role = user
    # plan = normal
    # --------------------------------------------------------

    new_user = User(
        username=username,
        email=email,
        password=hash_password(user.password),

        role="user",
        plan="normal",

        verified=False,

        verification_code=otp,
        verification_code_expires_at=expiry
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # --------------------------------------------------------
    # Send OTP
    # --------------------------------------------------------

    send_otp_email(
        new_user.email,
        otp
    )

    return new_user


# ============================================================
# VERIFY OTP
# ============================================================

@router.post("/verify-otp")
def verify_otp(
    data: OTPVerify,
    db: Session = Depends(get_db)
):

    email = data.email.lower().strip()

    user = (
        db.query(User)
        .filter(User.email == email)
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
        or datetime.utcnow()
        > user.verification_code_expires_at
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


# ============================================================
# RESEND OTP
# ============================================================

@router.post("/resend-otp/{email}")
def resend_otp(
    email: str,
    db: Session = Depends(get_db)
):

    email = email.lower().strip()

    user = (
        db.query(User)
        .filter(User.email == email)
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
        datetime.utcnow()
        + timedelta(minutes=10)
    )

    db.commit()

    send_otp_email(
        user.email,
        otp
    )

    return {
        "message": "OTP sent successfully"
    }


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=Token
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    login_value = form_data.username.strip()

    # --------------------------------------------------------
    # Find user using username OR email
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Verify password
    # --------------------------------------------------------

    if not verify_password(
        form_data.password,
        user.password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password"
        )

    # --------------------------------------------------------
    # Verify email
    # --------------------------------------------------------

    if not user.verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email first"
        )

    # --------------------------------------------------------
    # IMPORTANT
    #
    # Always read role + plan from DATABASE.
    #
    # This means if admin changes a user's plan later,
    # the next login receives the updated plan.
    # --------------------------------------------------------

    role = user.role or "user"
    plan = user.plan or "normal"

    # --------------------------------------------------------
    # Create JWT
    # --------------------------------------------------------

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "username": user.username,
            "role": role,
            "plan": plan
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ============================================================
# FORGOT PASSWORD
# ============================================================

@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):

    email = data.email.lower().strip()

    user = (
        db.query(User)
        .filter(User.email == email)
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
        datetime.utcnow()
        + timedelta(minutes=10)
    )

    db.commit()

    send_otp_email(
        user.email,
        otp
    )

    return {
        "message": "Password reset OTP sent to your email"
    }


# ============================================================
# RESET PASSWORD
# ============================================================

@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):

    email = data.email.lower().strip()

    user = (
        db.query(User)
        .filter(User.email == email)
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
        or datetime.utcnow()
        > user.verification_code_expires_at
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired"
        )

    user.password = hash_password(
        data.new_password
    )

    user.verification_code = None
    user.verification_code_expires_at = None

    db.commit()
    db.refresh(user)

    return {
        "message": "Password reset successfully"
    }


# ============================================================
# GET CURRENT USER
# ============================================================

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
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user


# ============================================================
# CURRENT USER PROFILE
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse
)
def get_me(
    current_user: User = Depends(get_current_user)
):

    return current_user


# ============================================================
# REQUIRE ADMIN
# ============================================================

def require_admin(
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


# ============================================================
# REQUIRE PREMIUM
# ============================================================
#
# Premium features:
#
#   PREMIUM USER -> allowed
#   ADMIN        -> allowed
#   NORMAL USER  -> blocked
#
# ============================================================

def require_premium(
    current_user: User = Depends(get_current_user)
):

    if (
        current_user.role != "admin"
        and current_user.plan != "premium"
    ):

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required"
        )

    return current_user


# ============================================================
# REQUIRE NORMAL OR PREMIUM USER
# ============================================================
#
# IMPORTANT:
#
# Admin is ALSO allowed here.
#
# This fixes your current problem:
#
# ADMIN -> Dashboard
# NORMAL -> Dashboard
# PREMIUM -> Dashboard
#
# ============================================================

def require_user(
    current_user: User = Depends(get_current_user)
):

    allowed_roles = ["user", "admin"]

    if current_user.role not in allowed_roles:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User access required"
        )

    return current_user


# ============================================================
# REQUIRE NORMAL USER ONLY
# ============================================================
#
# Only:
#
# role = user
# plan = normal
#
# ============================================================

def require_normal_user(
    current_user: User = Depends(get_current_user)
):

    if (
        current_user.role != "user"
        or current_user.plan != "normal"
    ):

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Normal user access required"
        )

    return current_user


# ============================================================
# REQUIRE PREMIUM USER ONLY
# ============================================================
#
# Only:
#
# role = user
# plan = premium
#
# Admin is NOT allowed here.
#
# Use this only when a feature is specifically for
# premium customers and not administrators.
#
# ============================================================

def require_premium_user(
    current_user: User = Depends(get_current_user)
):

    if (
        current_user.role != "user"
        or current_user.plan != "premium"
    ):

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium user access required"
        )

    return current_user