from datetime import date, datetime
from decimal import Decimal
import re

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    model_validator,
)


# =========================================================
# USER SCHEMAS
# =========================================================

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    phone: str = Field(
        min_length=10,
        max_length=10,
        pattern=r"^\d{10}$"
    )
    password: str
    confirm_password: str
    role: str = "user"

    @model_validator(mode="after")
    def validate_password(self):

        password = self.password

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

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    phone: str | None = None
    role: str
    plan: str
    verified: bool

    model_config = ConfigDict(from_attributes=True)


class OTPVerify(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)


# =========================================================
# LOGIN
# =========================================================

class EmailLogin(BaseModel):
    email: EmailStr
    password: str


# =========================================================
# FORGOT PASSWORD
# =========================================================

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


# =========================================================
# RESET PASSWORD
# =========================================================

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


# =========================================================
# JWT TOKEN
# =========================================================

class Token(BaseModel):
    access_token: str
    token_type: str


# =========================================================
# INCOME SCHEMAS
# =========================================================

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
    bank_account_id: int | None = None


class IncomeResponse(BaseModel):
    id: int
    user_id: int
    source: str
    category: str
    amount: Decimal
    description: str | None
    date: date
    bank_account_id: int | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# EXPENSE SCHEMAS
# =========================================================

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
    bank_account_id: int | None = None


class ExpenseResponse(BaseModel):
    id: int
    user_id: int
    category: str
    payment_method: str
    amount: Decimal
    description: str | None
    date: date
    bank_account_id: int | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# BANK ACCOUNT SCHEMAS
# =========================================================

class BankAccountCreate(BaseModel):
    bank_name: str
    account_holder: str
    account_number: str
    ifsc_code: str
    account_type: str = "Savings"
    current_balance: Decimal = Field(
        default=0,
        ge=0
    )
    is_primary: bool = False


class BankAccountUpdate(BaseModel):
    bank_name: str
    account_holder: str
    account_number: str
    ifsc_code: str
    account_type: str
    current_balance: Decimal = Field(
        ge=0
    )
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


# =========================================================
# BUDGET SCHEMAS
# =========================================================

class BudgetCreate(BaseModel):
    category: str
    monthly_limit: Decimal = Field(gt=0)
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2020, le=2100)
    bank_account_id: int


class BudgetUpdate(BaseModel):
    category: str
    monthly_limit: Decimal = Field(gt=0)
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2020, le=2100)
    bank_account_id: int


class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category: str
    monthly_limit: Decimal
    month: int
    year: int
    bank_account_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


class BudgetSummaryResponse(BaseModel):
    id: int
    category: str
    monthly_limit: float
    month: int
    year: int
    spent: float
    remaining: float
    percentage_used: float
    bank_account_id: int | None = None


# =========================================================
# SAVINGS GOAL SCHEMAS
# =========================================================

class SavingsGoalCreate(BaseModel):
    goal_name: str
    target_amount: Decimal = Field(gt=0)
    current_amount: Decimal = Field(
        default=0,
        ge=0
    )
    bank_account_id: int


class SavingsGoalUpdate(BaseModel):
    goal_name: str
    target_amount: Decimal = Field(gt=0)
    current_amount: Decimal = Field(
        ge=0
    )
    bank_account_id: int


class SavingsGoalAddAmount(BaseModel):
    amount: Decimal = Field(gt=0)


class SavingsGoalResponse(BaseModel):
    id: int
    user_id: int
    goal_name: str
    target_amount: Decimal
    current_amount: Decimal | None
    bank_account_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# SAVINGS TRANSACTION SCHEMAS
# =========================================================

class SavingsTransactionCreate(BaseModel):
    amount: Decimal = Field(gt=0)


class SavingsTransactionResponse(BaseModel):
    id: int
    goal_id: int
    user_id: int
    amount: Decimal
    transaction_date: date
    bank_account_id: int | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# PROFILE SCHEMAS
# =========================================================

class ProfileCreate(BaseModel):
    full_name: str
    monthly_income: Decimal | None = Field(
        default=None,
        ge=0
    )
    financial_preferences: str | None = None


class ProfileUpdate(BaseModel):
    full_name: str
    monthly_income: Decimal | None = Field(
        default=None,
        ge=0
    )
    financial_preferences: str | None = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    monthly_income: Decimal | None
    financial_preferences: str | None

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# NOTIFICATION SCHEMAS
# =========================================================

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# REPORT MODULES
# =========================================================

REPORT_MODULES = [
    "financial_summary",
    "income_transactions",
    "expense_transactions",
    "income_categories",
    "expense_categories",
    "budget_report",
    "savings_goals",
    "savings_transactions",
    "bank_account_details",
]


# =========================================================
# REPORT SCHEMAS
# =========================================================

class ReportCreate(BaseModel):
    report_type: str
    bank_account_id: int | None = None


class ReportUpdate(BaseModel):
    report_type: str
    bank_account_id: int | None = None


class ReportResponse(BaseModel):
    id: int
    user_id: int
    bank_account_id: int | None
    report_type: str
    generated_date: datetime | None

    model_config = ConfigDict(from_attributes=True)