"""Report context aggregation — gathers data from core-service and local DB.

Builds the full context dict that gets passed into the Jinja2 report
template.  Fetches inspection metadata from the core-service via HTTP
and enriches it with photo findings and RAG knowledge-base results.
"""
import logging
from datetime import datetime, timezone
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repository.photo_analysis import PhotoAnalysis

logger = logging.getLogger(__name__)


def _fetch_inspection_metadata(
    inspection_id: UUID,
    auth_token: str,
    core_url: str,
) -> dict:
    """Fetch inspection full-context from the core-service."""
    url = f"{core_url}/api/v1/inspections/{inspection_id}/full-context"
    headers = {"Cookie": f"access_token={auth_token}"} if auth_token else {}
    try:
        resp = httpx.get(url, headers=headers, timeout=15.0)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        logger.warning("Could not fetch inspection metadata: %s", exc)
        return {}


def _fetch_photo_findings(
    inspection_id: UUID,
    db: Session,
) -> list[dict]:
    """Query photo analyses linked to this inspection.

    In a full deployment the photo_analyses table would be linked to
    inspections via an area_photos join.  For the hackathon we return
    all recent analyses as findings.
    """
    rows = db.execute(
        select(PhotoAnalysis).order_by(PhotoAnalysis.created_at.desc()).limit(50)
    ).scalars().all()

    return [
        {
            "photo_id": str(r.photo_id),
            "defect_labels": r.defect_labels if isinstance(r.defect_labels, list) else [str(r.defect_labels)],
            "severity": r.severity,
            "description": r.description,
            "remediation": r.remediation,
        }
        for r in rows
    ]


def _search_relevant_standards(
    query: str,
    company_id: UUID | None,
    db: Session,
) -> list[dict]:
    """Query the RAG knowledge base for relevant building standards."""
    try:
        from app.services.rag_service import search_knowledge_base
        return search_knowledge_base(
            query=query,
            company_id=company_id,
            db=db,
            limit=3,
        )
    except Exception as exc:
        logger.warning("RAG search failed: %s", exc)
        return []


def gather_inspection_context(
    inspection_id: UUID,
    auth_token: str,
    db: Session,
) -> dict:
    """Build the full template context for a report.

    Returns a dict ready to be passed into the Jinja2 template's
    ``context`` variable plus top-level ``verify_url`` and
    ``qr_code_data`` placeholders (filled by report_service).
    """
    import os
    core_url = os.getenv("CORE_SERVICE_URL", "http://localhost:8002")

    # 1. Fetch inspection metadata from core-service
    meta = _fetch_inspection_metadata(inspection_id, auth_token, core_url)

    # 2. Photo findings from local DB
    findings = _fetch_photo_findings(inspection_id, db)

    # 3. Build a search query from the findings
    severity_labels = " ".join(
        f.get("description", "")[:100] for f in findings[:5]
    )
    standards = _search_relevant_standards(
        query=severity_labels or "building inspection standards",
        company_id=None,
        db=db,
    )

    # 4. Build remediation items from findings
    remediation_items = [
        {
            "title": ", ".join(f.get("defect_labels", ["Defect"])),
            "remediation": f.get("remediation", "No remediation provided."),
        }
        for f in findings
        if f.get("remediation")
    ]

    # 5. Build severity matrix
    severity_matrix = [
        {
            "finding": ", ".join(f.get("defect_labels", ["N/A"])),
            "severity": f.get("severity", "Low"),
            "location": f.get("description", "")[:80],
        }
        for f in findings
    ]

    context = {
        "company_name": meta.get("company_name", "DefectLoupe"),
        "property_address": meta.get("property_address", "Address not available"),
        "inspection_date": meta.get("inspection_date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        "inspector_name": meta.get("inspector_name", "Inspector"),
        "report_date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "executive_summary": meta.get("executive_summary", ""),
        "severity_matrix": severity_matrix,
        "photo_findings": findings,
        "remediation_items": remediation_items,
        "observations": meta.get("observations", ""),
        "relevant_standards": standards,
    }

    return context
