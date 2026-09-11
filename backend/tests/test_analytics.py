import pytest
from datetime import datetime
from tests.conftest import create_user_and_get_token

def test_F1_platform_system_financial_analytics(client):
    token = create_user_and_get_token(client, email="admin_ana@example.com", role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    current_month = datetime.utcnow().strftime("%Y-%m")
    resp = client.get(f"/api/v1/analytics/summary?month={current_month}", headers=headers)
    assert resp.status_code == 200

def test_F2_trend_12_month_horizon_premium(client):
    token = create_user_and_get_token(client, email="f2ana@example.com", role="premium")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/v1/analytics/trends?months=12", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 12

def test_F3_ai_burn_rate_forecast(client):
    token = create_user_and_get_token(client, email="f3ana@example.com", role="premium")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/v1/incomes/", headers=headers, json={"title": "Salary", "amount": 2000.0, "category": "Salary"})
    client.post("/api/v1/expenses/", headers=headers, json={"title": "Food", "amount": 200.0, "category": "Food"})
    current_month = datetime.utcnow().strftime("%Y-%m")
    resp = client.get(f"/api/v1/analytics/prediction?month={current_month}", headers=headers)
    assert resp.status_code == 200
    assert "daily_burn_rate" in resp.json()

def test_F4_export_reports(client):
    token = create_user_and_get_token(client, email="f4ana@example.com", role="premium")
    headers = {"Authorization": f"Bearer {token}"}
    current_month = datetime.utcnow().strftime("%Y-%m")
    resp = client.get(f"/api/v1/reports/export/excel?month={current_month}", headers=headers)
    assert resp.status_code == 200

def test_F5_student_12_month_truncation(client):
    token = create_user_and_get_token(client, email="f5ana@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/v1/analytics/trends?months=12", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 6

def test_F6_student_ai_forecast_access(client):
    token = create_user_and_get_token(client, email="f6ana@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    current_month = datetime.utcnow().strftime("%Y-%m")
    resp = client.get(f"/api/v1/analytics/prediction?month={current_month}", headers=headers)
    assert resp.status_code == 200

def test_F7_financial_summary_metrics(client):
    token = create_user_and_get_token(client, email="f7ana@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/v1/incomes/", headers=headers, json={"title": "Salary", "amount": 1000.0, "category": "Salary"})
    client.post("/api/v1/expenses/", headers=headers, json={"title": "Rent", "amount": 400.0, "category": "Housing"})
    current_month = datetime.utcnow().strftime("%Y-%m")
    resp = client.get(f"/api/v1/analytics/summary?month={current_month}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_income"] == 1000.0
    assert data["total_expense"] == 400.0

def test_F8_category_donut_breakdown(client):
    token = create_user_and_get_token(client, email="f8ana@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/v1/expenses/", headers=headers, json={"title": "Food", "amount": 100.0, "category": "Food"})
    current_month = datetime.utcnow().strftime("%Y-%m")
    resp = client.get(f"/api/v1/analytics/categories?month={current_month}", headers=headers)
    assert resp.status_code == 200
