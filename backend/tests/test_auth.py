import pytest
from app.models import User
from tests.conftest import create_user_and_get_token

def test_A1_admin_security_policy_and_privilege_audit(client):
    token = create_user_and_get_token(client, email="admin_audit@example.com", role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/v1/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["role"] == "admin"

def test_A2_social_oauth_login_integration(client):
    resp = client.post("/api/v1/auth/oauth/login", json={
        "provider": "google",
        "email": "googleuser@example.com",
        "full_name": "Google User",
        "provider_id": "google_123456"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()

def test_A3_student_account_registration(client):
    resp = client.post("/api/v1/auth/register", json={
        "email": "student_reg@example.com",
        "full_name": "Student User",
        "password": "Password123!",
        "role": "student"
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "student_reg@example.com"
    assert data["role"] == "student"

def test_A4_duplicate_email_registration_prevention(client):
    client.post("/api/v1/auth/register", json={
        "email": "dup@example.com",
        "full_name": "Dup User",
        "password": "Password123!"
    })
    resp = client.post("/api/v1/auth/register", json={
        "email": "dup@example.com",
        "full_name": "Dup User 2",
        "password": "Password123!"
    })
    assert resp.status_code == 400

def test_A5_email_otp_verification(client, db):
    client.post("/api/v1/auth/register", json={
        "email": "otpverif@example.com",
        "full_name": "OTP User",
        "password": "Password123!"
    })
    usr = db.query(User).filter(User.email == "otpverif@example.com").first()
    otp_code = usr.verification_code

    resp = client.post("/api/v1/auth/verify-email", json={
        "email": "otpverif@example.com",
        "code": otp_code
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()

def test_A6_invalid_or_expired_otp_rejection(client):
    client.post("/api/v1/auth/register", json={
        "email": "badotp@example.com",
        "full_name": "Bad OTP",
        "password": "Password123!"
    })
    resp = client.post("/api/v1/auth/verify-email", json={
        "email": "badotp@example.com",
        "code": "000000"
    })
    assert resp.status_code == 400

def test_A7_resend_otp_verification_code(client):
    client.post("/api/v1/auth/register", json={
        "email": "resendotp@example.com",
        "full_name": "Resend OTP",
        "password": "Password123!"
    })
    resp = client.post("/api/v1/auth/resend-verification", json={
        "email": "resendotp@example.com"
    })
    assert resp.status_code == 200

def test_A8_registration_password_mismatch(client):
    resp = client.post("/api/v1/auth/register", json={
        "email": "mismatch@example.com",
        "full_name": "Mismatch User",
        "password": "Password123!"
    })
    assert resp.status_code == 201

def test_A9_successful_login_and_token_generation(client):
    create_user_and_get_token(client, email="loginuser@example.com", password="Password123!")
    resp = client.post("/api/v1/auth/login", data={
        "username": "loginuser@example.com",
        "password": "Password123!"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()

def test_A10_invalid_login_credentials(client):
    resp = client.post("/api/v1/auth/login", data={
        "username": "nonexistent@example.com",
        "password": "wrongpassword"
    })
    assert resp.status_code == 401
