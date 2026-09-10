from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from pydantic import BaseModel, EmailStr

from fastapi.security import (
    OAuth2PasswordBearer,
    OAuth2PasswordRequestForm
)

from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from datetime import datetime, timedelta
import random

from app.database import get_db
from app.models import User

from app.schemas import (
    UserCreate,
    UserResponse,
    OTPVerify
)

from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)

from app.email_utils import send_otp_email


# ==========================================================
# ROUTER
# ==========================================================

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ==========================================================
# OAUTH2
# ==========================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/login"
)


# ==========================================================
# ACCOUNT UPDATE SCHEMA
# ==========================================================

class AccountUpdateRequest(BaseModel):
    username: str
    email: EmailStr


# ==========================================================
# CHANGE PASSWORD SCHEMA
# ==========================================================

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ==========================================================
# REGISTER
# ==========================================================

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
    email = user.email.strip().lower()

    # ------------------------------------------------------
    # CHECK USERNAME / EMAIL
    # ------------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            or_(
                func.lower(User.username) == username.lower(),
                func.lower(User.email) == email
            )
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or Email already exists"
        )

    # ------------------------------------------------------
    # GENERATE OTP
    # ------------------------------------------------------

    otp = str(
        random.randint(100000, 999999)
    )

    expiry = (
        datetime.utcnow()
        + timedelta(minutes=10)
    )

    # ------------------------------------------------------
    # CREATE USER
    # ------------------------------------------------------

    new_user = User(
        username=username,
        email=email,
        phone=user.phone,
        password=hash_password(user.password),

        # All new registrations are normal users
        role="user",

        verified=False,

        verification_code=otp,

        verification_code_expires_at=expiry
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # ------------------------------------------------------
    # SEND OTP
    # ------------------------------------------------------

    send_otp_email(
        new_user.email,
        otp
    )

    return new_user


# ==========================================================
# VERIFY OTP
# ==========================================================

@router.post("/verify-otp")
def verify_otp(
    data: OTPVerify,
    db: Session = Depends(get_db)
):

    email = data.email.strip().lower()

    user = (
        db.query(User)
        .filter(
            func.lower(User.email) == email
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # ------------------------------------------------------
    # CHECK OTP
    # ------------------------------------------------------

    if user.verification_code != data.otp:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )

    # ------------------------------------------------------
    # CHECK OTP EXPIRY
    # ------------------------------------------------------

    if (
        user.verification_code_expires_at is None
        or
        datetime.utcnow()
        > user.verification_code_expires_at
    ):

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired"
        )

    # ------------------------------------------------------
    # VERIFY USER
    # ------------------------------------------------------

    user.verified = True

    user.verification_code = None

    user.verification_code_expires_at = None

    db.commit()

    return {
        "message": "Email verified successfully"
    }


# ==========================================================
# RESEND OTP
# ==========================================================

@router.post("/resend-otp/{email}")
def resend_otp(
    email: str,
    db: Session = Depends(get_db)
):

    email = email.strip().lower()

    user = (
        db.query(User)
        .filter(
            func.lower(User.email) == email
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

    # ------------------------------------------------------
    # NEW OTP
    # ------------------------------------------------------

    otp = str(
        random.randint(100000, 999999)
    )

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


# ==========================================================
# LOGIN
# USERNAME OR EMAIL
# ==========================================================

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    login_value = (
        form_data.username.strip()
    )

    print("\n" + "=" * 60)
    print("LOGIN ATTEMPT")
    print("LOGIN VALUE:", login_value)
    print("=" * 60)

    # ------------------------------------------------------
    # FIND USER
    # ------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            or_(
                func.lower(User.username)
                == login_value.lower(),

                func.lower(User.email)
                == login_value.lower()
            )
        )
        .first()
    )

    # ------------------------------------------------------
    # USER NOT FOUND
    # ------------------------------------------------------

    if user is None:

        print("❌ USER NOT FOUND")

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    print("USER FOUND")
    print("ID      :", user.id)
    print("USERNAME:", user.username)
    print("EMAIL   :", user.email)
    print("ROLE    :", user.role)
    print("PLAN    :", user.plan)
    print("VERIFIED:", user.verified)

    # ------------------------------------------------------
    # PASSWORD
    # ------------------------------------------------------

    if not verify_password(
        form_data.password,
        user.password
    ):

        print("❌ PASSWORD INCORRECT")

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    # ------------------------------------------------------
    # EMAIL VERIFICATION
    # ------------------------------------------------------

    if not user.verified:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email first."
        )

    # ------------------------------------------------------
    # CREATE JWT
    # ------------------------------------------------------

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "username": user.username,
            "role": user.role,
            "plan": user.plan
        }
    )

    print("✅ LOGIN SUCCESSFUL")
    print("=" * 60)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ==========================================================
# GET CURRENT USER
# ==========================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    # ------------------------------------------------------
    # DECODE TOKEN
    # ------------------------------------------------------

    payload = decode_access_token(token)

    if payload is None:
        raise credentials_exception

    # ------------------------------------------------------
    # GET USER ID
    # ------------------------------------------------------

    user_id = payload.get("sub")

    if user_id is None:
        raise credentials_exception

    try:

        user_id = int(user_id)

    except (ValueError, TypeError):

        raise credentials_exception

    # ------------------------------------------------------
    # FIND USER IN DATABASE
    # ------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if user is None:
        raise credentials_exception

    return user


# ==========================================================
# GET /AUTH/ME
# ==========================================================

@router.get(
    "/me",
    response_model=UserResponse
)
def get_me(
    current_user: User = Depends(get_current_user)
):

    return current_user


# ==========================================================
# UPDATE ACCOUNT INFORMATION
# ==========================================================

@router.put("/account")
def update_account(
    data: AccountUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    new_username = (
        data.username.strip()
    )

    new_email = (
        str(data.email)
        .lower()
        .strip()
    )

    # ------------------------------------------------------
    # VALIDATE USERNAME
    # ------------------------------------------------------

    if not new_username:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username cannot be empty"
        )

    # ------------------------------------------------------
    # CHECK USERNAME
    # ------------------------------------------------------

    username_exists = (
        db.query(User)
        .filter(
            func.lower(User.username)
            == new_username.lower(),

            User.id != current_user.id
        )
        .first()
    )

    if username_exists:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    # ------------------------------------------------------
    # CHECK EMAIL
    # ------------------------------------------------------

    email_exists = (
        db.query(User)
        .filter(
            func.lower(User.email)
            == new_email.lower(),

            User.id != current_user.id
        )
        .first()
    )

    if email_exists:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    # ------------------------------------------------------
    # UPDATE
    # ------------------------------------------------------

    current_user.username = new_username

    current_user.email = new_email

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Account information updated successfully",
        "username": current_user.username,
        "email": current_user.email
    }


# ==========================================================
# SELF-SERVICE PREMIUM SUBSCRIPTION
# ==========================================================

@router.post("/subscribe-premium")
def subscribe_premium(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ------------------------------------------------------
    # ADMIN
    # ------------------------------------------------------

    if current_user.role == "admin":

        return {
            "message": "Admin already has premium-level access.",
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role,
            "plan": current_user.plan
        }

    # ------------------------------------------------------
    # ALREADY PREMIUM
    # ------------------------------------------------------

    if current_user.plan == "premium":

        return {
            "message": "You are already a premium user.",
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role,
            "plan": current_user.plan
        }

    # ------------------------------------------------------
    # UPGRADE
    # ------------------------------------------------------

    current_user.plan = "premium"

    db.commit()
    db.refresh(current_user)

    print("\n" + "=" * 60)
    print("PREMIUM SUBSCRIPTION")
    print("USER ID :", current_user.id)
    print("USERNAME:", current_user.username)
    print("PLAN    :", current_user.plan)
    print("=" * 60)

    return {
        "message": "Premium subscription activated successfully.",
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "plan": current_user.plan
    }


# ==========================================================
# UPGRADE-PREMIUM
#
# Kept as a compatibility endpoint in case your existing
# frontend still calls /auth/upgrade-premium.
# ==========================================================

@router.post("/upgrade-premium")
def upgrade_premium(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ------------------------------------------------------
    # ADMIN
    # ------------------------------------------------------

    if current_user.role == "admin":

        return {
            "message": "Admin already has premium-level access.",
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role,
            "plan": current_user.plan
        }

    # ------------------------------------------------------
    # ALREADY PREMIUM
    # ------------------------------------------------------

    if current_user.plan == "premium":

        return {
            "message": "You are already a premium user.",
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role,
            "plan": current_user.plan
        }

    # ------------------------------------------------------
    # UPGRADE
    # ------------------------------------------------------

    current_user.plan = "premium"

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Successfully upgraded to Premium.",
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "plan": current_user.plan
    }


# ==========================================================
# REQUIRE ADMIN
# ==========================================================

def require_admin(
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


# ==========================================================
# REQUIRE PREMIUM
# ==========================================================

def require_premium(
    current_user: User = Depends(get_current_user)
):

    # Admins have full access
    if current_user.role == "admin":

        return current_user

    # Premium users have access
    if (
        current_user.role == "user"
        and current_user.plan == "premium"
    ):

        return current_user

    # Everyone else is blocked
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Premium subscription required"
    )


# ==========================================================
# REQUIRE NORMAL OR PREMIUM USER
# ==========================================================
def require_user(
    current_user: User = Depends(get_current_user)
):
    """
    Allow all authenticated BudgetBuddy accounts
    to access common financial modules.

    Allowed:
    - Normal users
    - Premium users
    - Administrators
    """

    if current_user.role not in ["user", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User access required"
        )

    return current_user

# ==========================================================
# REQUIRE NORMAL USER ONLY
# ==========================================================

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