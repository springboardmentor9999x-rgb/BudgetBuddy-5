from datetime import date
from decimal import Decimal
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator
import re

# =========================
# USER SCHEMAS
# =========================

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str
    confirm_password: str
    role: str = "user"

    @model_validator(mode="after")
    def validate_password(self):
        password = self.password

        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")

        if not re.search(r"[A-Z]", password):
            raise ValueError("Password must contain at least one uppercase letter")

        if not re.search(r"[a-z]", password):
            raise ValueError("Password must contain at least one lowercase letter")

        if not re.search(r"\d", password):
            raise ValueError("Password must contain at least one number")

        if not re.search(r"[^A-Za-z0-9]", password):
            raise ValueError("Password must contain at least one special character")

        if password != self.confirm_password:
            raise ValueError("Passwords do not match")

        return self


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    verified: bool

    model_config = ConfigDict(from_attributes=True)
    
class OTPVerify(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)

# =========================
# EMAIL LOGIN SCHEMA
# =========================

class EmailLogin(BaseModel):
    email: EmailStr
    password: str


# =========================
# FORGOT PASSWORD SCHEMA
# =========================

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


# =========================
# RESET PASSWORD SCHEMA
# =========================

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str
    confirm_password: str

    @model_validator(mode="after")
    def validate_new_password(self):

        password = self.new_password

        if len(password) < 8:
            raise ValueError(
                "Password must be at least 8 characters long"
            )

        if not re.search(r"[A-Z]", password):
            raise ValueError(
                "Password must contain at least one uppercase letter"
            )

        if not re.search(r"[a-z]", password):
            raise ValueError(
                "Password must contain at least one lowercase letter"
            )

        if not re.search(r"\d", password):
            raise ValueError(
                "Password must contain at least one number"
            )

        if not re.search(r"[^A-Za-z0-9]", password):
            raise ValueError(
                "Password must contain at least one special character"
            )

        if password != self.confirm_password:
            raise ValueError(
                "Passwords do not match"
            )

        return self
    
# =========================
# JWT TOKEN SCHEMA
# =========================

class Token(BaseModel):
    access_token: str
    token_type: str

# =========================
# INCOME SCHEMAS
# =========================

class IncomeCreate(BaseModel):
    source: str
    category: str
    amount: Decimal = Field(gt=0)
    description: str | None = None
    date: date
    bank_account_id: int | None = None

class IncomeUpdate(BaseModel):
    source: str
    category: str
    amount: Decimal = Field(gt=0)
    description: str | None = None
    date: date
    bank_account_id: int

class IncomeResponse(BaseModel):
    id: int
    user_id: int
    source: str
    category: str
    amount: Decimal
    description: str | None
    date: date
    bank_account_id: int | None = None 

    model_config = ConfigDict(from_attributes=True)

# =========================
# EXPENSE SCHEMAS
# =========================

class ExpenseCreate(BaseModel):
    category: str
    payment_method: str
    amount: Decimal = Field(gt=0)
    description: str | None = None
    date: date
    bank_account_id: int | None = None


class ExpenseUpdate(BaseModel):
    category: str
    payment_method: str
    amount: Decimal = Field(gt=0)
    description: str | None = None
    date: date
    bank_account_id: int


class ExpenseResponse(BaseModel):
    id: int
    user_id: int
    category: str
    payment_method: str
    amount: Decimal
    description: str | None
    date: date
    bank_account_id: int | None = None

    model_config = ConfigDict(from_attributes=True)

# =========================
# BANK ACCOUNT SCHEMAS
# =========================

class BankAccountCreate(BaseModel):
    bank_name: str
    account_holder: str
    account_number: str
    ifsc_code: str
    account_type: str = "Savings"
    current_balance: Decimal = Field(default=0, ge=0)
    is_primary: bool = False

class BankAccountUpdate(BaseModel):
    bank_name: str
    account_holder: str
    account_number: str
    ifsc_code: str
    account_type: str
    current_balance: Decimal = Field(ge=0)
    is_primary: bool


class BankAccountResponse(BaseModel):
    id: int
    user_id: int
    bank_name: str
    account_holder: str
    account_number: str
    ifsc_code: str
    account_type: str
    current_balance: Decimal
    is_primary: bool

    model_config = ConfigDict(from_attributes=True)

# =========================
# BUDGET SCHEMAS
# =========================

class BudgetCreate(BaseModel):
    category: str
    monthly_limit: float
    month: int
    year: int


class BudgetUpdate(BaseModel):
    category: str
    monthly_limit: float
    month: int
    year: int


class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category: str
    monthly_limit: float
    month: int
    year: int

    class Config:
        orm_mode = True


class BudgetSummaryResponse(BaseModel):
    id: int
    category: str
    monthly_limit: float
    month: int
    year: int
    spent: float
    remaining: float
    percentage_used: float

# =========================
# SAVINGS GOAL SCHEMAS
# =========================

class SavingsGoalCreate(BaseModel):
    goal_name: str
    target_amount: Decimal = Field(gt=0)
    current_amount: Decimal = Field(default=0, ge=0)


class SavingsGoalUpdate(BaseModel):
    goal_name: str
    target_amount: Decimal = Field(gt=0)
    current_amount: Decimal = Field(ge=0)


class SavingsGoalAddAmount(BaseModel):
    amount: Decimal = Field(gt=0)


class SavingsGoalResponse(BaseModel):
    id: int
    user_id: int
    goal_name: str
    target_amount: Decimal
    current_amount: Decimal | None

    model_config = ConfigDict(from_attributes=True)

# =========================
# SAVINGS TRANSACTION SCHEMAS
# =========================

class SavingsTransactionCreate(BaseModel):
    amount: Decimal = Field(gt=0)


class SavingsTransactionResponse(BaseModel):
    id: int
    goal_id: int
    user_id: int
    amount: Decimal
    transaction_date: date

    model_config = ConfigDict(from_attributes=True)

# =========================
# PROFILE SCHEMAS
# =========================

class ProfileCreate(BaseModel):
    full_name: str
    monthly_income: Decimal | None = Field(default=None, ge=0)
    financial_preferences: str | None = None


class ProfileUpdate(BaseModel):
    full_name: str
    monthly_income: Decimal | None = Field(default=None, ge=0)
    financial_preferences: str | None = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    monthly_income: Decimal | None
    financial_preferences: str | None

    model_config = ConfigDict(from_attributes=True)

# =========================
# NOTIFICATION SCHEMAS
# =========================
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime | None = None

    class Config:
        from_attributes = True

# =========================
# REPORT SCHEMAS
# =========================

class ReportCreate(BaseModel):
    report_type: str


class ReportUpdate(BaseModel):
    report_type: str


class ReportResponse(BaseModel):
    id: int
    user_id: int
    report_type: str
    generated_date: datetime | None

    model_config = ConfigDict(from_attributes=True)

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str 

