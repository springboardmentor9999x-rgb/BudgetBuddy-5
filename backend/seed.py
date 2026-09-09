import sys
import os
from datetime import datetime, timedelta

# Ensure parent directory is in Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import User, Profile, Income, Expense, Budget, SavingsGoal, BankAccount, Notification, SystemLog, UserRole

def seed_database():
    print("Seeding BudgetBuddy database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        hashed_pwd = get_password_hash("password123")

        # 1. Admin User
        admin_user = db.query(User).filter(User.email == "admin@budgetbuddy.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@budgetbuddy.com",
                full_name="System Administrator",
                hashed_password=hashed_pwd,
                role=UserRole.ADMIN.value,
                is_email_verified=True
            )
            db.add(admin_user)
            db.flush()
            db.add(Profile(user_id=admin_user.id, monthly_income_target=5000.0, preferred_currency="USD"))
        else:
            admin_user.hashed_password = hashed_pwd
            admin_user.is_email_verified = True

        # 2. Student User
        student_user = db.query(User).filter(User.email == "student@budgetbuddy.com").first()
        if not student_user:
            student_user = User(
                email="student@budgetbuddy.com",
                full_name="bharadwaj (Student)",
                hashed_password=hashed_pwd,
                role=UserRole.STUDENT.value,
                is_email_verified=True
            )
            db.add(student_user)
            db.flush()
            db.add(Profile(user_id=student_user.id, monthly_income_target=1200.0, preferred_currency="USD", phone="+15550192834", bio="CS Major interested in budgeting & personal finance."))
        else:
            student_user.hashed_password = hashed_pwd
            student_user.is_email_verified = True

        # 3. Premium User
        premium_user = db.query(User).filter(User.email == "premium@budgetbuddy.com").first()
        if not premium_user:
            premium_user = User(
                email="premium@budgetbuddy.com",
                full_name="yashwanth (Premium)",
                hashed_password=hashed_pwd,
                role=UserRole.PREMIUM.value,
                is_email_verified=True
            )
            db.add(premium_user)
            db.flush()
            db.add(Profile(user_id=premium_user.id, monthly_income_target=3500.0, preferred_currency="USD"))
        else:
            premium_user.hashed_password = hashed_pwd
            premium_user.is_email_verified = True

        db.commit()

        # Seed data for Student User
        uid = student_user.id
        now = datetime.utcnow()
        current_month = now.strftime("%Y-%m")

        # Incomes
        incomes_data = [
            {"title": "Monthly Pocket Money", "amount": 600.0, "category": "Pocket Money", "date": now - timedelta(days=18), "description": "Monthly allowance from parents"},
            {"title": "Merit Scholarship Grant", "amount": 400.0, "category": "Scholarship", "date": now - timedelta(days=12), "description": "University quarterly stipend"},
            {"title": "Web Dev Freelance Gig", "amount": 350.0, "category": "Freelance", "date": now - timedelta(days=5), "description": "Client website fix"}
        ]
        for inc in incomes_data:
            db.add(Income(user_id=uid, **inc))

        # Expenses
        expenses_data = [
            {"title": "Campus Cafeteria Lunch", "amount": 18.50, "category": "Food", "date": now - timedelta(days=1), "payment_method": "Debit Card", "notes": "Lunch with classmates"},
            {"title": "Groceries at Walmart", "amount": 85.20, "category": "Food", "date": now - timedelta(days=3), "payment_method": "Credit Card", "notes": "Weekly groceries"},
            {"title": "Monthly Bus Pass", "amount": 45.00, "category": "Travel", "date": now - timedelta(days=15), "payment_method": "Debit Card", "notes": "Transit pass"},
            {"title": "Uber ride home from lab", "amount": 22.00, "category": "Travel", "date": now - timedelta(days=8), "payment_method": "UPI", "notes": "Late night study"},
            {"title": "Data Structures Textbook", "amount": 75.00, "category": "Education", "date": now - timedelta(days=14), "payment_method": "Credit Card", "notes": "Course requirement"},
            {"title": "Coursera Python Certificate", "amount": 49.00, "category": "Education", "date": now - timedelta(days=10), "payment_method": "Debit Card", "notes": "Skill development"},
            {"title": "Movie Night with Friends", "amount": 32.00, "category": "Entertainment", "date": now - timedelta(days=6), "payment_method": "Cash", "notes": "IMAX tickets"},
            {"title": "Spotify & Netflix Subscription", "amount": 19.99, "category": "Entertainment", "date": now - timedelta(days=16), "payment_method": "Credit Card", "notes": "Monthly stream"},
            {"title": "Winter Jacket Sale", "amount": 65.00, "category": "Shopping", "date": now - timedelta(days=11), "payment_method": "Credit Card", "notes": "Apparel discount"},
            {"title": "Stationery & Notebooks", "amount": 14.50, "category": "Miscellaneous", "date": now - timedelta(days=4), "payment_method": "Cash", "notes": "Exam prep supplies"}
        ]
        for exp in expenses_data:
            db.add(Expense(user_id=uid, **exp))

        # Budgets
        budgets_data = [
            {"category": "Food", "amount_allocated": 250.0, "month": current_month},
            {"category": "Travel", "amount_allocated": 100.0, "month": current_month},
            {"category": "Education", "amount_allocated": 150.0, "month": current_month},
            {"category": "Entertainment", "amount_allocated": 80.0, "month": current_month},
            {"category": "Shopping", "amount_allocated": 100.0, "month": current_month},
            {"category": "Miscellaneous", "amount_allocated": 50.0, "month": current_month}
        ]
        for b in budgets_data:
            db.add(Budget(user_id=uid, **b))

        # Bank Accounts & Cards
        bank_accounts_data = [
            {"account_name": "Chase Freedom Checking", "bank_name": "Chase", "account_type": "checking", "account_number_last4": "4892", "current_balance": 2450.00, "currency": "USD", "is_primary": True, "color_gradient": "from-blue-600 to-indigo-800"},
            {"account_name": "High Yield Savings", "bank_name": "HDFC / Ally", "account_type": "savings", "account_number_last4": "8810", "current_balance": 5200.50, "currency": "USD", "is_primary": False, "color_gradient": "from-emerald-600 to-teal-800"},
            {"account_name": "Apple Rewards Card", "bank_name": "Goldman Sachs", "account_type": "credit_card", "account_number_last4": "1304", "current_balance": -340.00, "currency": "USD", "is_primary": False, "color_gradient": "from-purple-600 to-pink-700"}
        ]
        for b in bank_accounts_data:
            db.add(BankAccount(user_id=uid, **b))

        # Savings Goals
        goals_data = [
            {"title": "New Laptop Fund", "target_amount": 1200.0, "current_amount": 750.0, "target_date": now + timedelta(days=90), "category": "Tech & Hardware", "is_completed": False},
            {"title": "Japan Trip Fund", "target_amount": 2000.0, "current_amount": 450.0, "target_date": now + timedelta(days=180), "category": "Travel & Vacation", "is_completed": False},
            {"title": "Emergency Savings", "target_amount": 500.0, "current_amount": 500.0, "target_date": now - timedelta(days=10), "category": "Financial Safety", "is_completed": True}
        ]
        for g in goals_data:
            db.add(SavingsGoal(user_id=uid, **g))

        # Notifications
        notifications_data = [
            {"title": "Welcome to BudgetBuddy!", "message": "Your financial tracking platform is live.", "type": "system", "is_read": True, "created_at": now - timedelta(days=20)},
            {"title": "Budget Alert: Food", "message": "You have spent 85% of your allocated food budget.", "type": "budget_alert", "is_read": False, "created_at": now - timedelta(days=2)},
            {"title": "Goal Reached: Emergency Savings", "message": "Congratulations! You completed your $500 Emergency Savings target.", "type": "goal_milestone", "is_read": True, "created_at": now - timedelta(days=10)}
        ]
        for n in notifications_data:
            db.add(Notification(user_id=uid, **n))

        # Logs
        logs_data = [
            {"user_id": admin_user.id, "action": "System Initialized", "details": "Database seeded with initial administrative parameters."},
            {"user_id": student_user.id, "action": "User Registered", "details": "Role: student"},
            {"user_id": student_user.id, "action": "Expense Added", "details": "Groceries at Walmart ($85.20)"}
        ]
        for l in logs_data:
            db.add(SystemLog(**l))

        db.commit()
        print("[OK] Database seeding complete! Demo accounts created:")
        print("   - Admin:   admin@budgetbuddy.com / password123")
        print("   - Student: student@budgetbuddy.com / password123")
        print("   - Premium: premium@budgetbuddy.com / password123")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
