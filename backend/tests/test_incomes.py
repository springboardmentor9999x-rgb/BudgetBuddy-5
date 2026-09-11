import pytest
from tests.conftest import create_user_and_get_token

def test_C1_platform_total_income_volume_audit(client):
    token = create_user_and_get_token(client, email="admin_inc_audit@example.com", role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/v1/admin/stats", headers=headers)
    assert resp.status_code == 200

def test_C2_log_recurring_income(client):
    token = create_user_and_get_token(client, email="c2inc@example.com", role="premium")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/api/v1/incomes/", headers=headers, json={
        "title": "Monthly Stipend",
        "amount": 1200.0,
        "category": "Stipend",
        "is_recurring": True
    })
    assert resp.status_code == 201
    assert resp.json()["amount"] == 1200.0

def test_C3_log_one_time_income(client):
    token = create_user_and_get_token(client, email="c3inc@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/api/v1/incomes/", headers=headers, json={
        "title": "Freelance Project",
        "amount": 350.0,
        "category": "Freelance"
    })
    assert resp.status_code == 201
    assert resp.json()["amount"] == 350.0

def test_C4_update_income(client):
    token = create_user_and_get_token(client, email="c4inc@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    create_resp = client.post("/api/v1/incomes/", headers=headers, json={"title": "Bonus", "amount": 100.0, "category": "General"})
    inc_id = create_resp.json()["id"]
    upd_resp = client.put(f"/api/v1/incomes/{inc_id}", headers=headers, json={"amount": 150.0})
    assert upd_resp.status_code == 200
    assert upd_resp.json()["amount"] == 150.0

def test_C5_delete_income(client):
    token = create_user_and_get_token(client, email="c5inc@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    create_resp = client.post("/api/v1/incomes/", headers=headers, json={"title": "To Delete", "amount": 100.0, "category": "General"})
    inc_id = create_resp.json()["id"]
    del_resp = client.delete(f"/api/v1/incomes/{inc_id}", headers=headers)
    assert del_resp.status_code == 204

def test_C6_fetch_and_filter_income_list(client):
    token = create_user_and_get_token(client, email="c6inc@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/v1/incomes/", headers=headers, json={"title": "Stipend", "amount": 1200.0, "category": "Stipend", "date": "2026-09-01"})
    list_resp = client.get("/api/v1/incomes/?month=2026-09", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1

def test_C7_invalid_income_amount(client):
    token = create_user_and_get_token(client, email="c7inc@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/api/v1/incomes/", headers=headers, json={
        "title": "Zero Income",
        "amount": -50.0,
        "category": "General"
    })
    assert resp.status_code == 422
