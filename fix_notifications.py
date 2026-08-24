from pathlib import Path
from dotenv import load_dotenv

# Load .env explicitly from C:\BudgetBuddy\.env
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

from datetime import datetime
from app.database import SessionLocal
from app.models import Notification


db = SessionLocal()

try:
    notifications = (
        db.query(Notification)
        .filter(Notification.created_at.is_(None))
        .all()
    )

    print(f"Found {len(notifications)} notifications with NULL created_at")

    for notification in notifications:
        notification.created_at = datetime.utcnow()
        print(f"Fixed notification ID: {notification.id}")

    db.commit()
    print("All broken notifications fixed successfully.")

finally:
    db.close()