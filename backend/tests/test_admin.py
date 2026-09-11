import pytest
from tests.conftest import create_user_and_get_token

def test_G1_admin_stats(client):
    token = create_user_and_get_token(client, email="g1admin@example.com", role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/v1/admin/stats", headers=headers)
    assert resp.status_code == 200
    assert "user_statistics" in resp.json()

def test_G2_admin_logs(client):
    token = create_user_and_get_token(client, email="g2admin@example.com", role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/v1/admin/logs", headers=headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_G3_admin_list_users(client):
    token = create_user_and_get_token(client, email="g3admin@example.com", role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/v1/admin/users", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

def test_G4_admin_self_role_lock(client):
    token = create_user_and_get_token(client, email="g4admin@example.com", role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    admin_id = client.get("/api/v1/auth/me", headers=headers).json()["id"]

    resp = client.put(f"/api/v1/admin/users/{admin_id}/role?role=student", headers=headers)
    assert resp.status_code == 400

def test_G5_block_admin_promotion(client):
    token = create_user_and_get_token(client, email="g5admin@example.com", role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    target_token = create_user_and_get_token(client, email="targetuser@example.com", role="student")
    target_headers = {"Authorization": f"Bearer {target_token}"}
    target_id = client.get("/api/v1/auth/me", headers=target_headers).json()["id"]

    resp = client.put(f"/api/v1/admin/users/{target_id}/role?role=admin", headers=headers)
    assert resp.status_code == 400

def test_G6_approve_premium_upgrade(client):
    token = create_user_and_get_token(client, email="g6admin@example.com", role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    target_token = create_user_and_get_token(client, email="upgradeuser@example.com", role="student")
    target_headers = {"Authorization": f"Bearer {target_token}"}
    target_id = client.get("/api/v1/auth/me", headers=target_headers).json()["id"]

    resp = client.put(f"/api/v1/admin/users/{target_id}/role?role=premium", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["role"] == "premium"

def test_G7_toggle_user_status(client):
    token = create_user_and_get_token(client, email="g7admin@example.com", role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    target_token = create_user_and_get_token(client, email="statususer@example.com", role="student")
    target_headers = {"Authorization": f"Bearer {target_token}"}
    target_id = client.get("/api/v1/auth/me", headers=target_headers).json()["id"]

    resp = client.put(f"/api/v1/admin/users/{target_id}/status?is_active=false", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["is_active"] == False

def test_G8_non_admin_forbidden(client):
    token = create_user_and_get_token(client, email="student_guard@example.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/v1/admin/stats", headers=headers)
    assert resp.status_code == 403
