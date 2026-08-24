from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Notification, User
from app.users import get_current_user
from app.schemas import NotificationResponse


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# ==================================================
# GET ALL NOTIFICATIONS
# ==================================================

@router.get(
    "",
    response_model=list[NotificationResponse]
)
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id
        )
        .order_by(
            Notification.created_at.desc()
        )
        .all()
    )

    return notifications


# ==================================================
# GET UNREAD NOTIFICATION COUNT
# ==================================================

@router.get("/unread/count")
def get_unread_notification_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
        .count()
    )

    return {
        "unread_count": count
    }


# ==================================================
# MARK NOTIFICATION AS READ
# ==================================================

@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
        .first()
    )

    if notification is None:

        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification

# ==================================================
# DELETE NOTIFICATION
# ==================================================

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
        .first()
    )

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    db.delete(notification)
    db.commit()

    return {
        "message": "Notification deleted successfully"
    }