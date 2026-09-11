from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class TokenData(BaseModel):
    sub: Optional[str] = None

# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: Optional[str] = "student"

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    is_email_verified: bool = False
    has_pending_premium_request: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


# Profile Schemas
class ProfileBase(BaseModel):
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    monthly_income_target: Optional[float] = 0.0
    preferred_currency: Optional[str] = "USD"
    email_notifications_enabled: Optional[bool] = True
    overspending_alert_threshold: Optional[float] = 80.0

class ProfileUpdate(ProfileBase):
    pass

class ProfileOut(ProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# Bank Account Schemas
class BankAccountBase(BaseModel):
    account_name: str
    bank_name: str
    account_type: str = "checking" # "checking", "savings", "credit_card"
    account_number_last4: str = "0000"
    current_balance: float = 0.0
    account_limit: Optional[float] = 0.0 # Card Limit
    currency: str = "USD"
    is_primary: bool = False
    color_gradient: Optional[str] = "from-blue-600 to-indigo-800"

class BankAccountCreate(BankAccountBase):
    pass

class BankAccountUpdate(BaseModel):
    account_name: Optional[str] = None
    bank_name: Optional[str] = None
    account_type: Optional[str] = None
    account_number_last4: Optional[str] = None
    current_balance: Optional[float] = None
    account_limit: Optional[float] = None
    currency: Optional[str] = None
    is_primary: Optional[bool] = None
    color_gradient: Optional[str] = None

class BankAccountOut(BankAccountBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Income Schemas
class IncomeBase(BaseModel):
    title: str
    amount: float = Field(gt=0, description="Income amount must be greater than zero")
    category: str
    date: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = None
    bank_account_id: Optional[int] = None

class IncomeCreate(IncomeBase):
    pass

class IncomeUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[datetime] = None
    description: Optional[str] = None
    bank_account_id: Optional[int] = None

class IncomeOut(IncomeBase):
    id: int
    user_id: int
    bank_account: Optional[BankAccountOut] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Expense Schemas
class ExpenseBase(BaseModel):
    title: str
    amount: float = Field(gt=0, description="Expense amount must be greater than zero")
    category: str
    date: datetime = Field(default_factory=datetime.utcnow)
    payment_method: Optional[str] = "Cash"
    notes: Optional[str] = None
    bank_account_id: Optional[int] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[datetime] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    bank_account_id: Optional[int] = None

class ExpenseOut(ExpenseBase):
    id: int
    user_id: int
    bank_account: Optional[BankAccountOut] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Budget Schemas
class BudgetBase(BaseModel):
    category: str
    amount_allocated: float = Field(gt=0)
    month: str # format: YYYY-MM
    description: Optional[str] = None

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    amount_allocated: Optional[float] = None
    category: Optional[str] = None
    month: Optional[str] = None
    description: Optional[str] = None

class BudgetOut(BudgetBase):
    id: int
    user_id: int
    amount_spent: float = 0.0
    utilization_percentage: float = 0.0
    status: str = "normal" # 'normal', 'warning', 'exceeded'
    created_at: datetime

    class Config:
        from_attributes = True

# Savings Goal Schemas
class SavingsGoalBase(BaseModel):
    title: str
    target_amount: float = Field(gt=0)
    current_amount: float = 0.0
    target_date: Optional[datetime] = None
    category: Optional[str] = "General"
    description: Optional[str] = None

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsGoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[datetime] = None
    category: Optional[str] = None
    is_completed: Optional[bool] = None

class SavingsContribution(BaseModel):
    amount: float = Field(gt=0)

class SavingsGoalOut(SavingsGoalBase):
    id: int
    user_id: int
    is_completed: bool
    progress_percentage: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Analytics & Reports Schemas
class SummaryAnalytics(BaseModel):
    total_income: float
    total_expense: float
    net_savings: float
    savings_rate: float
    active_budgets_count: int
    active_goals_count: int

class CategorySpending(BaseModel):
    category: str
    amount: float
    percentage: float

class MonthlyTrend(BaseModel):
    month: str
    income: float
    expense: float

class DailyForecastPoint(BaseModel):
    day: int
    date_str: str
    actual_spent: Optional[float] = None
    projected_spent: Optional[float] = None
    income_limit: float

class CashflowPrediction(BaseModel):
    daily_burn_rate: float
    days_elapsed: int
    days_in_month: int
    days_remaining: int
    current_spent: float
    current_income: float
    projected_month_end_expense: float
    projected_month_end_balance: float
    status: str  # 'healthy', 'warning', 'danger'
    run_out_date: Optional[str] = None
    forecast_points: List[DailyForecastPoint]


class SystemLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    user_email: Optional[str] = None
    action: str
    details: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

# OAuth Mock Schema
class OAuthLoginRequest(BaseModel):
    provider: str # "google" or "github"
    email: EmailStr
    full_name: str
    provider_id: str


