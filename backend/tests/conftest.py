import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.models import User, Profile, UserRole
from app.core.security import get_password_hash, create_access_token

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=engine)

# Create tables once for testing session
Base.metadata.create_all(bind=engine)

@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

def create_user_and_get_token(client, email="user@example.com", name="Test User", password="password123", role="student"):
    db_gen = app.dependency_overrides[get_db]()
    session = next(db_gen)
    usr = session.query(User).filter(User.email == email).first()
    if not usr:
        usr = User(
            email=email,
            full_name=name,
            hashed_password=get_password_hash(password),
            role=role,
            is_email_verified=True,
            is_active=True
        )
        session.add(usr)
        session.commit()
        session.refresh(usr)
        profile = Profile(user_id=usr.id, monthly_income_target=1000.0, preferred_currency="USD")
        session.add(profile)
        session.commit()
    else:
        usr.is_email_verified = True
        usr.is_active = True
        usr.role = role
        session.commit()

    token = create_access_token(subject=usr.id)
    return token
