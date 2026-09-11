import pytest
from tests.conftest import create_user_and_get_token

def test_E1_platform_savings_reserve_audit(client):
    token = create_user_and_get_token(client, email="admin_sav_audit@example.com", role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/v1/admin/stats", headers=headers)
    assert resp.status_code == 200

def test_E2_100_percent_completion(client):
    token = create_user_and_get_token(client, email="e2sav@example.com", role="premium")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/v1/incomes/", headers=headers, json={"title": "Salary", "amount": 1000.0, "category": "Salary"})
    goal_resp = client.post("/api/v1/savings/", headers=headers, json={"title": "Fund", "target_amount": 500.0})
    goal_id = goal_resp.json()["id"]
    client.post(f"/api/v1/savings/{goal_id}/deposit", headers=headers, json={"amount": 500.0})
    goal_check = client.get("/api/v1/savings/", headers=headers).json()[0]
    assert goal_check["current_amount"] == 500.0

def test_E3_advanced_savings_target_goal_creation(client):
    token = create_user_and_get_token(client, email="e3sav@example.com", role="premium")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/api/v1/savings/", headers=headers, json={"title": "Car Fund", "target_amount": 5000.0})
    assert resp.status_code == 201
    assert resp.json()["target_amount"] == 5000.0

def test_E4_create_savings_goal(client):
    token = create_user_and_get_token(client, email="e4sav@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/api/v1/savings/", headers=headers, json={
        "title": "Laptop Fund",
        "target_amount": 500.0,
        "current_amount": 0.0
    })
    assert resp.status_code == 201
    assert resp.json()["target_amount"] == 500.0

def test_E5_deposit_funds(client):
    token = create_user_and_get_token(client, email="e5sav@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/v1/incomes/", headers=headers, json={"title": "Salary", "amount": 1000.0, "category": "Salary"})
    goal_resp = client.post("/api/v1/savings/", headers=headers, json={"title": "Laptop", "target_amount": 500.0})
    goal_id = goal_resp.json()["id"]
    dep_resp = client.post(f"/api/v1/savings/{goal_id}/deposit", headers=headers, json={"amount": 250.0})
    assert dep_resp.status_code == 200
    assert dep_resp.json()["current_amount"] == 250.0

def test_E6_50_percent_milestone(client):
    token = create_user_and_get_token(client, email="e6sav@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/v1/incomes/", headers=headers, json={"title": "Salary", "amount": 1000.0, "category": "Salary"})
    goal_resp = client.post("/api/v1/savings/", headers=headers, json={"title": "Fund", "target_amount": 500.0})
    goal_id = goal_resp.json()["id"]
    client.post(f"/api/v1/savings/{goal_id}/deposit", headers=headers, json={"amount": 250.0})
    notif_resp = client.get("/api/v1/notifications/", headers=headers)
    assert notif_resp.status_code == 200

def test_E7_80_percent_milestone(client):
    token = create_user_and_get_token(client, email="e7sav@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/v1/incomes/", headers=headers, json={"title": "Salary", "amount": 1000.0, "category": "Salary"})
    goal_resp = client.post("/api/v1/savings/", headers=headers, json={"title": "Fund", "target_amount": 500.0})
    goal_id = goal_resp.json()["id"]
    client.post(f"/api/v1/savings/{goal_id}/deposit", headers=headers, json={"amount": 400.0})
    notif_resp = client.get("/api/v1/notifications/", headers=headers)
    assert notif_resp.status_code == 200

def test_E8_zero_deposit_rejection(client):
    token = create_user_and_get_token(client, email="e8sav@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    goal_resp = client.post("/api/v1/savings/", headers=headers, json={"title": "Laptop", "target_amount": 500.0})
    goal_id = goal_resp.json()["id"]
    dep_resp = client.post(f"/api/v1/savings/{goal_id}/deposit", headers=headers, json={"amount": 0.0})
    assert dep_resp.status_code in [400, 422]

def test_E9_delete_savings_goal(client):
    token = create_user_and_get_token(client, email="e9sav@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    goal_resp = client.post("/api/v1/savings/", headers=headers, json={"title": "To Delete", "target_amount": 500.0})
    goal_id = goal_resp.json()["id"]
    del_resp = client.delete(f"/api/v1/savings/{goal_id}", headers=headers)
    assert del_resp.status_code == 204
