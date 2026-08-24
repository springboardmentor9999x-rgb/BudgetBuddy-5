from sqlalchemy.orm import Session
from app.models import Notification


def create_notification(
    db: Session,
    user_id: int,
    message: str,
    notification_type: str = "info"
):

    notification = Notification(
        user_id=user_id,
        message=message,
        notification_type=notification_type,
        is_read=False
    )

    db.add(notification)