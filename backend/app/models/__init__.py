from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base

class UserRole(str, enum.Enum):
    STUDENT = "student"
    PREMIUM = "premium"
    ADMIN = "admin"

class IncomeCategory(str, enum.Enum):
    POCKET_MONEY = "Pocket Money"
    SCHOLARSHIP = "Scholarship"
    FREELANCE = "Freelance"
    PART_TIME = "Part-Time Job"
    OTHER = "Other"

class ExpenseCategory(str, enum.Enum):
    FOOD = "Food"
    TRAVEL = "Travel"
    SHOPPING = "Shopping"
    EDUCATION = "Education"
    ENTERTAINMENT = "Entertainment"
    MISCELLANEOUS = "Miscellaneous"

class NotificationType(str, enum.Enum):
    BUDGET_ALERT = "budget_alert"
    OVERSPENDING = "overspending"
    SAVINGS_REMINDER = "savings_reminder"
    GOAL_MILESTONE = "goal_milestone"
    MONTHLY_REPORT = "monthly_report"
    PREMIUM_REQUEST = "premium_request"
    SYSTEM = "system"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.STUDENT.value, nullable=False)
    is_active = Column(Boolean, default=True)
    is_email_verified = Column(Boolean, default=False)
    has_pending_premium_request = Column(Boolean, default=False)
    verification_code = Column(String, nullable=True)
    verification_code_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    incomes = relationship("Income", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    savings_goals = relationship("SavingsGoal", back_populates="user", cascade="all, delete-orphan")
    bank_accounts = relationship("BankAccount", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    logs = relationship("SystemLog", back_populates="user", cascade="all, delete-orphan")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    phone = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    monthly_income_target = Column(Float, default=0.0)
    preferred_currency = Column(String, default="USD")
    email_notifications_enabled = Column(Boolean, default=True)
    overspending_alert_threshold = Column(Float, default=80.0) # Percentage

    user = relationship("User", back_populates="profile")

class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, default=IncomeCategory.POCKET_MONEY.value, nullable=False)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="incomes")
    bank_account = relationship("BankAccount")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, default=ExpenseCategory.FOOD.value, nullable=False)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    payment_method = Column(String, default="Cash") # Cash, Credit Card, Debit Card, UPI, Bank Transfer
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="expenses")
    bank_account = relationship("BankAccount")

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)
    amount_allocated = Column(Float, nullable=False)
    month = Column(String, nullable=False) # e.g. '2026-07'
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="budgets")

class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    target_date = Column(DateTime, nullable=True)
    category = Column(String, default="General")
    description = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="savings_goals")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default=NotificationType.SYSTEM.value, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="logs")

class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    account_name = Column(String, nullable=False) # e.g. "Chase Freedom Checking"
    bank_name = Column(String, nullable=False)    # e.g. "Chase", "HDFC", "SBI"
    account_type = Column(String, default="checking") # "checking", "savings", "credit_card"
    account_number_last4 = Column(String, default="0000")
    current_balance = Column(Float, default=0.0)
    account_limit = Column(Float, default=0.0) # Credit card limit or max overdraft limit
    currency = Column(String, default="USD")
    is_primary = Column(Boolean, default=False)
    color_gradient = Column(String, default="from-blue-600 to-indigo-800")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bank_accounts")

