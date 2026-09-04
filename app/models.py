from datetime import datetime, date, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Date,
    DateTime,
    Text,
    Boolean,
    ForeignKey,
    CheckConstraint,
)

from sqlalchemy.sql import func

from app.database import Base


# ============================================================
# USER
# ============================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String(50),
        unique=True,
        nullable=False
    )

    email = Column(
        String(100),
        unique=True,
        nullable=False
    )

    password = Column(
        String(255),
        nullable=False
    )

    # ========================================================
    # USER ROLE
    #
    # user     = Normal User
    # premium  = Premium User
    # admin    = Administrator
    # ========================================================

    role = Column(
        String(20),
        default="user",
        nullable=False
    )

    # Prevent invalid roles from being stored in database
    __table_args__ = (
        CheckConstraint(
            "role IN ('user', 'premium', 'admin')",
            name="valid_user_role"
        ),
    )
    
    plan = Column(
        String(20),
        default="normal",
        nullable=False
    )

    verified = Column(
        Boolean,
        default=False,
        nullable=False
    )

    verification_code = Column(
        String(255),
        nullable=True
    )

    verification_code_expires_at = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


# ============================================================
# BANK ACCOUNT
# ============================================================

class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    bank_name = Column(
        String(100),
        nullable=False
    )

    account_holder = Column(
        String(100),
        nullable=False
    )

    account_number = Column(
        String(30),
        nullable=False
    )

    ifsc_code = Column(
        String(20),
        nullable=False
    )

    account_type = Column(
        String(30),
        nullable=False
    )

    current_balance = Column(
        Numeric(12, 2),
        default=0
    )

    is_primary = Column(
        Boolean,
        default=False
    )


# ============================================================
# INCOME
# ============================================================

class Income(Base):
    __tablename__ = "income"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    source = Column(
        String(100),
        nullable=False
    )

    category = Column(
        String(100),
        nullable=False
    )

    amount = Column(
        Numeric(12, 2),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    date = Column(
        Date,
        nullable=False
    )

    bank_account_id = Column(
        Integer,
        ForeignKey(
            "bank_accounts.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


# ============================================================
# EXPENSE
# ============================================================

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    category = Column(
        String(100),
        nullable=False
    )

    payment_method = Column(
        String(50),
        nullable=False
    )

    amount = Column(
        Numeric(12, 2),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    date = Column(
        Date,
        nullable=False
    )

    bank_account_id = Column(
        Integer,
        ForeignKey(
            "bank_accounts.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


# ============================================================
# BUDGET
# ============================================================

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    bank_account_id = Column(
        Integer,
        ForeignKey(
            "bank_accounts.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    category = Column(
        String(100),
        nullable=False
    )

    monthly_limit = Column(
        Numeric(12, 2),
        nullable=False
    )

    month = Column(
        Integer,
        nullable=False
    )

    year = Column(
        Integer,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


# ============================================================
# SAVINGS GOAL
# ============================================================

class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    bank_account_id = Column(
        Integer,
        ForeignKey(
            "bank_accounts.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    goal_name = Column(
        String(100),
        nullable=False
    )

    target_amount = Column(
        Numeric(12, 2),
        nullable=False
    )

    current_amount = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


# ============================================================
# SAVINGS TRANSACTION
# ============================================================

class SavingsTransaction(Base):
    __tablename__ = "savings_transactions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    goal_id = Column(
        Integer,
        ForeignKey("savings_goals.id"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    bank_account_id = Column(
        Integer,
        ForeignKey(
            "bank_accounts.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    amount = Column(
        Numeric(12, 2),
        nullable=False
    )

    transaction_date = Column(
        Date,
        default=date.today,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


# ============================================================
# PROFILE
# ============================================================

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    full_name = Column(
        String,
        nullable=False
    )

    monthly_income = Column(
        Numeric,
        nullable=True
    )

    financial_preferences = Column(
        Text,
        nullable=True
    )


# ============================================================
# NOTIFICATION
# ============================================================

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    message = Column(
        String,
        nullable=False
    )

    notification_type = Column(
        String,
        nullable=False,
        default="info"
    )

    is_read = Column(
        Boolean,
        default=False,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False
    )


# ============================================================
# REPORT
# ============================================================

class Report(Base):
    __tablename__ = "reports"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    bank_account_id = Column(
        Integer,
        ForeignKey(
            "bank_accounts.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    report_type = Column(
        Text,
        nullable=False
    )

    generated_date = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )