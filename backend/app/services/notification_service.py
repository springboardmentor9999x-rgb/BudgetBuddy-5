from sqlalchemy.orm import Session
from app.models import Notification, NotificationType, SystemLog
from typing import Optional

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = NotificationType.SYSTEM.value
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

def log_system_action(
    db: Session,
    user_id: Optional[int],
    action: str,
    details: Optional[str] = None
) -> SystemLog:
    log_entry = SystemLog(
        user_id=user_id,
        action=action,
        details=details
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
