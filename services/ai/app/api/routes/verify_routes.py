"""Public report verification route.

Exposes an unauthenticated endpoint that allows anyone to verify
the authenticity of a generated inspection report by its verify_token.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from shared.db_config import get_db
from app.repository.report_job import ReportJob, ReportStatus
from app.api.dtos.verify_dto import ReportVerificationResponse

router = APIRouter(prefix="/api/v1", tags=["Public Verification"])


@router.get(
    "/reports/{verify_token}/verify",
    response_model=ReportVerificationResponse,
    summary="Verify the authenticity of an inspection report (public)",
)
def verify_report(
    verify_token: str,
    db: Session = Depends(get_db),
):
    """Public endpoint — no authentication required.

    Looks up a ReportJob by verify_token.  If the job exists and is
    READY, returns verification details with a summary extracted from
    the stored report_json.  Otherwise returns valid=False.
    """
    job = db.execute(
        select(ReportJob).where(ReportJob.verify_token == verify_token)
    ).scalar_one_or_none()

    if job is None or job.status != ReportStatus.READY:
        return ReportVerificationResponse(
            valid=False,
            verify_token=verify_token,
            status="invalid",
            error="Invalid or unverified report token",
        )

    # Extract summary from stored report_json
    summary = None
    if job.report_json:
        report = job.report_json
        summary = {
            "property_address": report.get("property_address"),
            "inspection_date": report.get("inspection_date"),
            "inspector_name": report.get("inspector_name"),
            "executive_summary": report.get("executive_summary"),
            "total_findings": len(report.get("photo_findings", [])),
            "severity_counts": _count_severities(report.get("photo_findings", [])),
        }

    return ReportVerificationResponse(
        valid=True,
        verify_token=verify_token,
        inspection_id=job.inspection_id,
        status=job.status.value,
        completed_at=job.completed_at,
        summary=summary,
    )


def _count_severities(findings: list[dict]) -> dict[str, int]:
    """Count findings by severity level."""
    counts: dict[str, int] = {}
    for f in findings:
        sev = f.get("severity", "Unknown")
        counts[sev] = counts.get(sev, 0) + 1
    return counts
