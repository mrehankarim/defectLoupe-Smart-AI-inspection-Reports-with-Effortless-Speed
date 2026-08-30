"""API routes for the Inspection resource."""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from shared.db_config import get_db
from shared.auth_deps import get_current_inspector
from app.repository.inspection import InspectionStatus
from app.api.dtos.inspection_dto import (
    CreateInspectionRequest,
    UpdateInspectionRequest,
    InspectionResponse,
    InspectionListResponse,
)
from app.services import inspection_service

router = APIRouter(prefix="/api/v1/inspections", tags=["inspections"])


@router.post("", response_model=InspectionResponse, status_code=201, summary="Create a new inspection")
def create_inspection(
    data: CreateInspectionRequest,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Create a new inspection for a property."""
    return inspection_service.create_inspection(data, inspector, db)


@router.get("", response_model=InspectionListResponse, summary="List inspections with optional filters")
def list_inspections(
    status: InspectionStatus | None = Query(None),
    property_id: UUID | None = Query(None),
    client_id: UUID | None = Query(None),
    date_from: str | None = Query(None, description="ISO date, e.g. 2026-01-01"),
    date_to: str | None = Query(None, description="ISO date, e.g. 2026-12-31"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None),
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """List inspections with optional filters."""
    return inspection_service.list_inspections(
        inspector, db, status, property_id, client_id, date_from, date_to, skip, limit, search,
    )


@router.get("/{inspection_id}", response_model=InspectionResponse, summary="Get inspection details")
def get_inspection(
    inspection_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Get details of a single inspection."""
    return inspection_service.get_inspection(inspection_id, inspector, db)


@router.patch("/{inspection_id}", response_model=InspectionResponse, summary="Update inspection (details and/or status transition)")
def update_inspection(
    inspection_id: UUID,
    data: UpdateInspectionRequest,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Update inspection details and/or transition status."""
    return inspection_service.update_inspection(inspection_id, data, inspector, db)


@router.get("/{inspection_id}/full-context", summary="Get aggregated inspection data for reports and mobile")
def get_inspection_full_context(
    inspection_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Aggregated inspection data for reports and mobile app."""
    return inspection_service.get_full_context(inspection_id, inspector, db)


# ── CSV Export ────────────────────────────────────────────────────────────

from fastapi.responses import StreamingResponse
import csv
import io


@router.get("/export/csv", summary="Export inspections as CSV file")
def export_inspections_csv(
    status: InspectionStatus | None = Query(None),
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Export inspections as a CSV file."""
    result = inspection_service.list_inspections(
        inspector, db, status_filter=status, limit=10000,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Title", "Status", "Property ID", "Inspector ID", "Created At", "Updated At"])
    for item in result.items:
        writer.writerow([
            item.id, item.title, item.status.value,
            item.property_id, item.inspector_id,
            item.created_at.isoformat(), item.updated_at.isoformat(),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inspections.csv"},
    )
