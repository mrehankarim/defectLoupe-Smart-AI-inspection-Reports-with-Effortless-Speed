"""Celery task for async PDF report generation.

Wraps report_service.generate_pdf_report in a Celery task so that
report generation runs in a background worker without blocking the
API request.
"""
import logging
from datetime import datetime, timezone
from uuid import UUID

from app.workers.celery_app import celery_app
from app.repository.report_job import ReportJob, ReportStatus

logger = logging.getLogger(__name__)


@celery_app.task(name="generate_report_task", bind=True, max_retries=2)
def generate_report_task(self, job_id: str) -> dict:
    """Generate a PDF report for the given ReportJob.

    Fetches the job, sets status to PROCESSING, runs the pipeline,
    and handles failures by setting status to FAILED with error_message.
    """
    from shared.db_config import SessionLocal

    job_uuid = UUID(job_id)
    db = SessionLocal()

    try:
        # Mark as processing
        job = db.get(ReportJob, job_uuid)
        if job is None:
            logger.error("ReportJob %s not found", job_id)
            return {"status": "error", "detail": "Job not found"}

        job.status = ReportStatus.PROCESSING
        db.commit()

        # Run the pipeline
        from app.services.report_service import generate_pdf_report
        generate_pdf_report(job_id=job_uuid, db=db)

        return {"status": "ok", "job_id": job_id}

    except Exception as exc:
        logger.exception("Report generation failed for job %s", job_id)

        # Update job status to FAILED
        try:
            job = db.get(ReportJob, job_uuid)
            if job is not None:
                job.status = ReportStatus.FAILED
                job.error_message = str(exc)[:2000]
                job.completed_at = datetime.now(timezone.utc)
                db.commit()
        except Exception:
            logger.exception("Failed to update job %s to FAILED", job_id)

        return {"status": "failed", "job_id": job_id, "error": str(exc)}

    finally:
        db.close()
