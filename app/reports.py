from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Report, User
from app.schemas import ReportCreate, ReportUpdate, ReportResponse
from app.users import get_current_user


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.post(
    "",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED
)
def create_report(
    data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = Report(
        user_id=current_user.id,
        report_type=data.report_type,
        generated_date=datetime.now()
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return report


@router.get("", response_model=list[ReportResponse])
def get_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(Report)
        .filter(Report.user_id == current_user.id)
        .all()
    )


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = (
        db.query(Report)
        .filter(
            Report.id == report_id,
            Report.user_id == current_user.id
        )
        .first()
    )

    if report is None:
        raise HTTPException(404, "Report not found")

    return report


@router.put("/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: int,
    data: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = (
        db.query(Report)
        .filter(
            Report.id == report_id,
            Report.user_id == current_user.id
        )
        .first()
    )

    if report is None:
        raise HTTPException(404, "Report not found")

    report.report_type = data.report_type

    db.commit()
    db.refresh(report)

    return report


@router.delete(
    "/{report_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = (
        db.query(Report)
        .filter(
            Report.id == report_id,
            Report.user_id == current_user.id
        )
        .first()
    )

    if report is None:
        raise HTTPException(404, "Report not found")

    db.delete(report)
    db.commit()

    return None