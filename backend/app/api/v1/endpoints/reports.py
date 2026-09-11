from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, Expense, Income, UserRole
from app.services.export_service import generate_csv_export, generate_excel_export, generate_pdf_report

router = APIRouter()

@router.get("/csv")
@router.get("/export/csv")
def export_expenses_csv(
    month: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    if month:
        query = query.filter(Expense.date.like(f"{month}%"))
    expenses = query.all()

    data = [
        {
            "ID": e.id,
            "Date": str(e.date)[:10],
            "Title": e.title,
            "Category": e.category,
            "Amount": e.amount,
            "Payment Method": e.payment_method,
            "Notes": e.notes or ""
        }
        for e in expenses
    ]
    csv_file = generate_csv_export(data)
    filename = f"expenses_{month or 'all'}.csv"
    return StreamingResponse(
        csv_file,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/excel")
@router.get("/export/excel")
def export_financial_excel(
    month: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exp_query = db.query(Expense).filter(Expense.user_id == current_user.id)
    inc_query = db.query(Income).filter(Income.user_id == current_user.id)
    if month:
        exp_query = exp_query.filter(Expense.date.like(f"{month}%"))
        inc_query = inc_query.filter(Income.date.like(f"{month}%"))

    expenses_data = [
        {"ID": e.id, "Date": str(e.date)[:10], "Title": e.title, "Category": e.category, "Amount": e.amount, "Payment": e.payment_method}
        for e in exp_query.all()
    ]
    incomes_data = [
        {"ID": i.id, "Date": str(i.date)[:10], "Title": i.title, "Category": i.category, "Amount": i.amount}
        for i in inc_query.all()
    ]

    excel_file = generate_excel_export(incomes_data, expenses_data)
    filename = f"financial_report_{month or 'all'}.xlsx"
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/pdf")
@router.get("/export/pdf")
def export_financial_pdf(
    month: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_month = month or datetime.utcnow().strftime("%Y-%m")

    total_income = db.query(func.sum(Income.amount)).filter(
        Income.user_id == current_user.id,
        Income.date.like(f"{target_month}%")
    ).scalar() or 0.0

    total_expense = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == current_user.id,
        Expense.date.like(f"{target_month}%")
    ).scalar() or 0.0

    net_savings = total_income - total_expense
    savings_rate = (net_savings / total_income * 100) if total_income > 0 else 0.0

    summary = {
        "total_income": total_income,
        "total_expense": total_expense,
        "net_savings": net_savings,
        "savings_rate": max(savings_rate, 0.0)
    }

    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        Expense.date.like(f"{target_month}%")
    ).order_by(Expense.date.desc()).all()

    exp_list = [
        {"date": str(e.date)[:10], "title": e.title, "category": e.category, "payment_method": e.payment_method, "amount": e.amount}
        for e in expenses
    ]

    include_charts = current_user.role in [UserRole.PREMIUM.value, UserRole.ADMIN.value]

    pdf_file = generate_pdf_report(
        user_name=current_user.full_name,
        period=target_month,
        summary=summary,
        expenses=exp_list,
        include_charts=include_charts
    )

    return StreamingResponse(
        pdf_file,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=budgetbuddy_report_{target_month}.pdf"}
    )
