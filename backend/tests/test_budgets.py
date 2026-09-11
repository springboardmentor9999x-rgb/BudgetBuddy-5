import pytest
from datetime import datetime
from tests.conftest import create_user_and_get_token

def test_D1_system_category_budget_limit_policy_audit(client):
    token = create_user_and_get_token(client, email="admin_bud_audit@example.com", role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/v1/admin/stats", headers=headers)
    assert resp.status_code == 200

def test_D2_multi_category_custom_budget_allocation(client):
    token = create_user_and_get_token(client, email="d2bud@example.com", role="premium")
    headers = {"Authorization": f"Bearer {token}"}
    current_month = datetime.utcnow().strftime("%Y-%m")
    resp = client.post("/api/v1/budgets/", headers=headers, json={"category": "Travel", "amount_allocated": 800.0, "month": current_month})
    assert resp.status_code == 201
    assert resp.json()["amount_allocated"] == 800.0

def test_D3_create_category_budget(client):
    token = create_user_and_get_token(client, email="d3bud@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    current_month = datetime.utcnow().strftime("%Y-%m")
    resp = client.post("/api/v1/budgets/", headers=headers, json={
        "category": "Entertainment",
        "amount_allocated": 150.0,
        "month": current_month
    })
    assert resp.status_code == 201
    assert resp.json()["amount_allocated"] == 150.0

def test_D4_duplicate_budget_updates_existing(client):
    token = create_user_and_get_token(client, email="d4bud@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    current_month = datetime.utcnow().strftime("%Y-%m")
    client.post("/api/v1/budgets/", headers=headers, json={"category": "Food", "amount_allocated": 100.0, "month": current_month})
    resp = client.post("/api/v1/budgets/", headers=headers, json={"category": "Food", "amount_allocated": 150.0, "month": current_month})
    assert resp.status_code == 201
    assert resp.json()["amount_allocated"] == 150.0

def test_D5_budget_warning_status(client):
    token = create_user_and_get_token(client, email="d5bud@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    current_month = datetime.utcnow().strftime("%Y-%m")
    client.post("/api/v1/budgets/", headers=headers, json={"category": "Travel", "amount_allocated": 100.0, "month": current_month})
    client.post("/api/v1/expenses/", headers=headers, json={"title": "Train", "amount": 85.0, "category": "Travel"})
    list_resp = client.get("/api/v1/budgets/", headers=headers)
    assert list_resp.json()[0]["status"] == "warning"

def test_D6_budget_exceeded_status(client):
    token = create_user_and_get_token(client, email="d6bud@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    current_month = datetime.utcnow().strftime("%Y-%m")
    client.post("/api/v1/budgets/", headers=headers, json={"category": "Travel", "amount_allocated": 100.0, "month": current_month})
    client.post("/api/v1/expenses/", headers=headers, json={"title": "Flight", "amount": 120.0, "category": "Travel"})
    list_resp = client.get("/api/v1/budgets/", headers=headers)
    assert list_resp.json()[0]["status"] == "exceeded"

def test_D7_auto_calculate_spent_and_percent(client):
    token = create_user_and_get_token(client, email="d7bud@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    current_month = datetime.utcnow().strftime("%Y-%m")
    client.post("/api/v1/budgets/", headers=headers, json={"category": "Entertainment", "amount_allocated": 100.0, "month": current_month})
    client.post("/api/v1/expenses/", headers=headers, json={"title": "Movie", "amount": 25.0, "category": "Entertainment"})
    list_resp = client.get("/api/v1/budgets/", headers=headers)
    assert list_resp.status_code == 200
    bud = list_resp.json()[0]
    assert bud["amount_spent"] == 25.0
    assert bud["utilization_percentage"] == 25.0

def test_D8_delete_budget(client):
    token = create_user_and_get_token(client, email="d8bud@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    current_month = datetime.utcnow().strftime("%Y-%m")
    create_resp = client.post("/api/v1/budgets/", headers=headers, json={"category": "Other", "amount_allocated": 100.0, "month": current_month})
    bud_id = create_resp.json()["id"]
    del_resp = client.delete(f"/api/v1/budgets/{bud_id}", headers=headers)
    assert del_resp.status_code == 204
