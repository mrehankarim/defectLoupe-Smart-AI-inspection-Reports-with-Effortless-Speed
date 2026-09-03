"""Report Generation routes.

Exposes endpoints under /api/v1/inspections for the full report
lifecycle: creation, status polling, PDF download, and JSON retrieval.
"""
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from shared.db_config import get_db
from shared.auth_deps import get_current_inspector
from app.repository.report_job import ReportJob, ReportStatus
from app.api.dtos.report_dto import ReportJobResponse, ReportStatusResponse
from app.workers.report_worker import generate_report_task

router = APIRouter(prefix="/api/v1", tags=["Report Generation"])


@router.post(
    "/inspections/{inspection_id}/generate-report",
    response_model=ReportJobResponse,
    status_code=201,
    summary="Queue a PDF report generation job",
)
def generate_report(
    inspection_id: str,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Create a ReportJob and trigger async PDF generation via Celery."""
    job = ReportJob(
        inspection_id=inspection_id,
        status=ReportStatus.QUEUED,
        verify_token=uuid.uuid4().hex,  # placeholder; overwritten during generation
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Trigger async task
    try:
        generate_report_task.delay(str(job.id))
    except Exception:
        # If Celery/Redis is unavailable, run synchronously as fallback
        try:
            from app.services.report_service import generate_pdf_report
            generate_pdf_report(job_id=job.id, db=db)
        except Exception as exc:
            job.status = ReportStatus.FAILED
            job.error_message = str(exc)[:2000]
            db.commit()

    return ReportJobResponse(
        job_id=job.id,
        inspection_id=job.inspection_id,
        status=job.status.value,
        verify_token=job.verify_token,
        created_at=job.created_at,
    )


@router.get(
    "/inspections/{inspection_id}/report/status",
    response_model=ReportStatusResponse,
    summary="Get status of the latest report job for an inspection",
)
def report_status(
    inspection_id: str,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Return the status of the most recent report job."""
    job = db.execute(
        select(ReportJob)
        .where(ReportJob.inspection_id == inspection_id)
        .order_by(ReportJob.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()

    if job is None:
        raise HTTPException(status_code=404, detail="No report job found for this inspection.")

    return ReportStatusResponse(
        job_id=job.id,
        status=job.status.value,
        pdf_url=job.pdf_url,
        error_message=job.error_message,
    )


@router.get(
    "/inspections/{inspection_id}/report/pdf",
    summary="Download the generated PDF report",
)
def report_pdf(
    inspection_id: str,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Return the generated PDF file for the latest ready report."""
    job = db.execute(
        select(ReportJob)
        .where(ReportJob.inspection_id == inspection_id)
        .where(ReportJob.status == ReportStatus.READY)
        .order_by(ReportJob.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()

    if job is None:
        raise HTTPException(status_code=404, detail="No ready report found for this inspection.")

    pdf_path = Path(job.pdf_url) if job.pdf_url else None
    if pdf_path is None or not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on disk.")

    media_type = "application/pdf" if pdf_path.suffix == ".pdf" else "text/html"
    return FileResponse(path=str(pdf_path), media_type=media_type, filename=pdf_path.name)


@router.get(
    "/inspections/{inspection_id}/report/json",
    summary="Get the structured JSON report payload",
)
def report_json(
    inspection_id: str,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Return the structured JSON report for the latest ready report."""
    job = db.execute(
        select(ReportJob)
        .where(ReportJob.inspection_id == inspection_id)
        .where(ReportJob.status == ReportStatus.READY)
        .order_by(ReportJob.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()

    if job is None:
        raise HTTPException(status_code=404, detail="No ready report found for this inspection.")

    if job.report_json is None:
        raise HTTPException(status_code=404, detail="Report JSON not available.")

    return JSONResponse(content=job.report_json)
