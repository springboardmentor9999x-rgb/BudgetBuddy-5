from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine
from app.users import router as auth_router
from app.income import router as income_router
from app.expenses import router as expenses_router
from app.budgets import router as budgets_router
from app.savings_goals import router as savings_goals_router
from app.profiles import router as profiles_router
from app.notifications import router as notifications_router
from app.reports import router as reports_router
from app.banks import router as banks_router
from app.dashboard import router as dashboard_router
from app.admin import router as admin_router
from app.analytics import router as analytics_router

app = FastAPI(title="BudgetBuddy API")
app.add_middleware(
    CORSMiddleware,
   allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://wondrous-pastelito-31414b.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Authentication routes
app.include_router(auth_router)
app.include_router(income_router)
app.include_router(expenses_router)
app.include_router(budgets_router)
app.include_router(savings_goals_router)
app.include_router(profiles_router)
app.include_router(notifications_router)
app.include_router(reports_router)
app.include_router(banks_router)
app.include_router(dashboard_router)
app.include_router(admin_router)
app.include_router(analytics_router)

@app.get("/")
def home():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "message": "FastAPI Connected to PostgreSQL Successfully"
        }

    except Exception as e:
        return {
            "error": str(e)
        }