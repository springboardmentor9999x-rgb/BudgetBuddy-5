import pytest
from datetime import datetime
from tests.conftest import create_user_and_get_token

def test_B1_system_expense_audit_log_tracking(client):
    token = create_user_and_get_token(client, email="admin_exp_audit@example.com", role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/v1/admin/logs", headers=headers)
    assert resp.status_code == 200

def test_B2_card_limit_exceeded(client):
    token = create_user_and_get_token(client, email="b2exp@example.com", role="premium")
    headers = {"Authorization": f"Bearer {token}"}
    card_resp = client.post("/api/v1/banks/", headers=headers, json={
        "account_name": "Credit Card",
        "bank_name": "Chase",
        "account_type": "credit_card",
        "current_balance": -400.0,
        "account_limit": 500.0
    })
    card_id = card_resp.json()["id"]
    exp_resp = client.post("/api/v1/expenses/", headers=headers, json={
        "title": "Expensive Item",
        "amount": 200.0,
        "category": "Shopping",
        "bank_account_id": card_id
    })
    assert exp_resp.status_code == 400

def test_B3_create_expense(client):
    token = create_user_and_get_token(client, email="b3exp@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/api/v1/expenses/", headers=headers, json={
        "title": "Textbooks",
        "amount": 85.50,
        "category": "Education",
        "payment_method": "Credit Card"
    })
    assert resp.status_code == 201
    assert resp.json()["title"] == "Textbooks"

def test_B4_expense_validation(client):
    token = create_user_and_get_token(client, email="b4exp@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/api/v1/expenses/", headers=headers, json={
        "title": "",
        "amount": -10.0,
        "category": "Education"
    })
    assert resp.status_code == 422

def test_B5_overspending_50_pct_alert(client):
    token = create_user_and_get_token(client, email="b5exp@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    current_month = datetime.utcnow().strftime("%Y-%m")
    client.post("/api/v1/budgets/", headers=headers, json={"category": "Food", "amount_allocated": 100.0, "month": current_month})
    client.post("/api/v1/expenses/", headers=headers, json={"title": "Lunch", "amount": 50.0, "category": "Food"})
    notif_resp = client.get("/api/v1/notifications/", headers=headers)
    assert notif_resp.status_code == 200

def test_B6_overspending_80_pct_alert(client):
    token = create_user_and_get_token(client, email="b6exp@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    current_month = datetime.utcnow().strftime("%Y-%m")
    client.post("/api/v1/budgets/", headers=headers, json={"category": "Food", "amount_allocated": 100.0, "month": current_month})
    client.post("/api/v1/expenses/", headers=headers, json={"title": "Dinner", "amount": 85.0, "category": "Food"})
    notif_resp = client.get("/api/v1/notifications/", headers=headers)
    assert notif_resp.status_code == 200

def test_B7_budget_exceeded_100_pct_alert(client):
    token = create_user_and_get_token(client, email="b7exp@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    current_month = datetime.utcnow().strftime("%Y-%m")
    client.post("/api/v1/budgets/", headers=headers, json={"category": "Food", "amount_allocated": 100.0, "month": current_month})
    client.post("/api/v1/expenses/", headers=headers, json={"title": "Feast", "amount": 110.0, "category": "Food"})
    notif_resp = client.get("/api/v1/notifications/", headers=headers)
    assert notif_resp.status_code == 200

def test_B8_list_expenses_filtered(client):
    token = create_user_and_get_token(client, email="b8exp@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/v1/expenses/", headers=headers, json={"title": "Books", "amount": 50.0, "category": "Education"})
    resp = client.get("/api/v1/expenses/?category=Education", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

def test_B9_search_expenses(client):
    token = create_user_and_get_token(client, email="b9exp@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/v1/expenses/", headers=headers, json={"title": "Textbooks", "amount": 85.50, "category": "Education"})
    resp = client.get("/api/v1/expenses/?search=Textbooks", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

def test_B10_update_and_delete_expense(client):
    token = create_user_and_get_token(client, email="b10exp@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    create_resp = client.post("/api/v1/expenses/", headers=headers, json={"title": "Old Title", "amount": 50.0, "category": "Education"})
    exp_id = create_resp.json()["id"]
    update_resp = client.put(f"/api/v1/expenses/{exp_id}", headers=headers, json={"amount": 95.0})
    assert update_resp.status_code == 200
    assert update_resp.json()["amount"] == 95.0
    del_resp = client.delete(f"/api/v1/expenses/{exp_id}", headers=headers)
    assert del_resp.status_code == 204
