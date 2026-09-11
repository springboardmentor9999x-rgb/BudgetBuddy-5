from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, Income, Expense, Budget, SavingsGoal
from app.schemas.schemas import SummaryAnalytics, CategorySpending, MonthlyTrend, CashflowPrediction, DailyForecastPoint

router = APIRouter()

@router.get("/summary", response_model=SummaryAnalytics)
def get_summary_analytics(
    month: str = None, # YYYY-MM
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_month = month or datetime.utcnow().strftime("%Y-%m")

    total_income = db.query(func.sum(Income.amount)).filter(
        Income.user_id == current_user.id,
        Income.date.like(f"{current_month}%")
    ).scalar() or 0.0

    total_expense = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == current_user.id,
        Expense.date.like(f"{current_month}%")
    ).scalar() or 0.0

    total_savings_allocated = db.query(func.sum(SavingsGoal.current_amount)).filter(
        SavingsGoal.user_id == current_user.id
    ).scalar() or 0.0

    net_savings = total_income - total_expense - total_savings_allocated
    savings_rate = (net_savings / total_income * 100) if total_income > 0 else 0.0

    budgets_count = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == current_month
    ).count()

    goals_count = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == current_user.id,
        SavingsGoal.is_completed == False
    ).count()

    return SummaryAnalytics(
        total_income=round(total_income, 2),
        total_expense=round(total_expense, 2),
        net_savings=round(net_savings, 2),
        savings_rate=round(max(savings_rate, 0.0), 1),
        active_budgets_count=budgets_count,
        active_goals_count=goals_count
    )

@router.get("/categories", response_model=List[CategorySpending])
def get_category_spending(
    month: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_month = month or datetime.utcnow().strftime("%Y-%m")
    results = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total")
    ).filter(
        Expense.user_id == current_user.id,
        Expense.date.like(f"{current_month}%")
    ).group_by(Expense.category).all()

    total_all = sum([r.total for r in results]) or 1.0
    res = []
    for cat, amount in results:
        res.append(CategorySpending(
            category=cat,
            amount=round(amount, 2),
            percentage=round((amount / total_all) * 100, 1)
        ))
    return res

@router.get("/trends", response_model=List[MonthlyTrend])
def get_monthly_trends(
    month: Optional[str] = None, # YYYY-MM
    months: int = 6,
    months_count: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_months = months_count if months_count is not None else months
    # Enforce role restriction: Students are capped at 6 months maximum
    if current_user.role == "student":
        target_months = min(target_months, 6)

    target_month_str = month or datetime.utcnow().strftime("%Y-%m")
    try:
        year, mon = map(int, target_month_str.split("-"))
    except ValueError:
        now = datetime.utcnow()
        year, mon = now.year, now.month

    months_list = []
    curr_y, curr_m = year, mon
    for _ in range(target_months):
        months_list.append(f"{curr_y:04d}-{curr_m:02d}")
        curr_m -= 1
        if curr_m < 1:
            curr_m = 12
            curr_y -= 1
    months_list.reverse()

    trends = []
    for m_str in months_list:
        inc = db.query(func.sum(Income.amount)).filter(
            Income.user_id == current_user.id,
            Income.date.like(f"{m_str}%")
        ).scalar() or 0.0

        exp = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == current_user.id,
            Expense.date.like(f"{m_str}%")
        ).scalar() or 0.0

        trends.append(MonthlyTrend(
            month=m_str,
            income=round(inc, 2),
            expense=round(exp, 2)
        ))
    return trends

import calendar

@router.get("/prediction", response_model=CashflowPrediction)
def get_cashflow_prediction(
    month: Optional[str] = None, # YYYY-MM
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.utcnow()
    target_month_str = month or now.strftime("%Y-%m")
    year, mon = map(int, target_month_str.split("-"))
    _, days_in_month = calendar.monthrange(year, mon)

    # Determine days elapsed
    if now.year == year and now.month == mon:
        days_elapsed = now.day
    elif (now.year, now.month) > (year, mon):
        days_elapsed = days_in_month
    else:
        days_elapsed = 1

    days_remaining = max(days_in_month - days_elapsed, 0)

    total_income = db.query(func.sum(Income.amount)).filter(
        Income.user_id == current_user.id,
        Income.date.like(f"{target_month_str}%")
    ).scalar() or 0.0

    total_expense = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == current_user.id,
        Expense.date.like(f"{target_month_str}%")
    ).scalar() or 0.0

    daily_burn_rate = round(total_expense / max(days_elapsed, 1), 2)
    projected_additional_expense = daily_burn_rate * days_remaining
    projected_month_end_expense = round(total_expense + projected_additional_expense, 2)
    projected_month_end_balance = round(total_income - projected_month_end_expense, 2)

    status_str = "healthy"
    run_out_date_str = None

    if total_income > 0 and projected_month_end_expense > total_income:
        status_str = "danger"
        if daily_burn_rate > 0:
            run_out_day = min(max(int(total_income / daily_burn_rate), 1), days_in_month)
            month_name = calendar.month_name[mon]
            run_out_date_str = f"{month_name} {run_out_day}"
    elif total_income > 0 and projected_month_end_balance < (total_income * 0.15):
        status_str = "warning"

    # Build forecast points
    expenses_in_month = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        Expense.date.like(f"{target_month_str}%")
    ).all()

    # Aggregate actual expenses by day
    actual_by_day = {}
    for exp in expenses_in_month:
        day_num = exp.date.day
        actual_by_day[day_num] = actual_by_day.get(day_num, 0.0) + exp.amount

    forecast_points = []
    cumulative_actual = 0.0

    for d in range(1, days_in_month + 1):
        month_abbr = calendar.month_abbr[mon]
        lbl = f"{month_abbr} {d}"

        if d <= days_elapsed:
            cumulative_actual += actual_by_day.get(d, 0.0)
            forecast_points.append(DailyForecastPoint(
                day=d,
                date_str=lbl,
                actual_spent=round(cumulative_actual, 2),
                projected_spent=round(cumulative_actual, 2),
                income_limit=round(total_income, 2)
            ))
        else:
            proj = cumulative_actual + (daily_burn_rate * (d - days_elapsed))
            forecast_points.append(DailyForecastPoint(
                day=d,
                date_str=lbl,
                actual_spent=None,
                projected_spent=round(proj, 2),
                income_limit=round(total_income, 2)
            ))

    return CashflowPrediction(
        daily_burn_rate=daily_burn_rate,
        days_elapsed=days_elapsed,
        days_in_month=days_in_month,
        days_remaining=days_remaining,
        current_spent=round(total_expense, 2),
        current_income=round(total_income, 2),
        projected_month_end_expense=projected_month_end_expense,
        projected_month_end_balance=projected_month_end_balance,
        status=status_str,
        run_out_date=run_out_date_str,
        forecast_points=forecast_points
    )

