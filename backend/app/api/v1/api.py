from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, users, profiles, incomes, expenses, budgets, savings, bank_accounts, notifications, analytics, reports, admin
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["Profiles"])
api_router.include_router(incomes.router, prefix="/incomes", tags=["Incomes"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["Expenses"])
api_router.include_router(budgets.router, prefix="/budgets", tags=["Budgets"])
api_router.include_router(savings.router, prefix="/savings", tags=["Savings Goals"])
api_router.include_router(bank_accounts.router, prefix="/banks", tags=["Bank Accounts & Cards"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports & Data Export"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Panel"])
