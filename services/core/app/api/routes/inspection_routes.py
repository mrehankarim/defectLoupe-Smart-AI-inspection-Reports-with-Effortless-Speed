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


@router.post("", response_model=InspectionResponse, status_code=201)
def create_inspection(
    data: CreateInspectionRequest,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Create a new inspection for a property."""
    return inspection_service.create_inspection(data, inspector, db)


@router.get("", response_model=InspectionListResponse)
def list_inspections(
    status: InspectionStatus | None = Query(None),
    property_id: UUID | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None),
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """List inspections with optional filters."""
    return inspection_service.list_inspections(
        inspector, db, status, property_id, skip, limit, search,
    )


@router.get("/{inspection_id}", response_model=InspectionResponse)
def get_inspection(
    inspection_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Get details of a single inspection."""
    return inspection_service.get_inspection(inspection_id, inspector, db)


@router.patch("/{inspection_id}", response_model=InspectionResponse)
def update_inspection(
    inspection_id: UUID,
    data: UpdateInspectionRequest,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Update inspection details and/or transition status."""
    return inspection_service.update_inspection(inspection_id, data, inspector, db)


@router.get("/{inspection_id}/full-context")
def get_inspection_full_context(
    inspection_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Aggregated inspection data for reports and mobile app."""
    return inspection_service.get_full_context(inspection_id, inspector, db)
