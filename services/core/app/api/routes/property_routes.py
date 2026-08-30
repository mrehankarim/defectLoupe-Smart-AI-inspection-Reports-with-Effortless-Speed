"""API routes for the Property resource."""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from shared.db_config import get_db
from shared.auth_deps import get_current_inspector
from app.api.dtos.property_dto import (
    CreatePropertyRequest,
    UpdatePropertyRequest,
    PropertyResponse,
    PropertyListResponse,
)
from app.services import property_service

router = APIRouter(prefix="/api/v1/properties", tags=["properties"])


@router.post("", response_model=PropertyResponse, status_code=201, summary="Create a new property")
def create_property(
    data: CreatePropertyRequest,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Create a new property linked to a client."""
    return property_service.create_property(data, inspector, db)


@router.get("", response_model=PropertyListResponse, summary="List properties (tenant-scoped)")
def list_properties(
    client_id: UUID | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None),
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """List all properties visible to the current inspector/agency."""
    return property_service.list_properties(inspector, db, client_id, skip, limit, search)


@router.get("/{property_id}", response_model=PropertyResponse, summary="Get property details")
def get_property(
    property_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Get details of a single property."""
    return property_service.get_property(property_id, inspector, db)


@router.patch("/{property_id}", response_model=PropertyResponse, summary="Update property details")
def update_property(
    property_id: UUID,
    data: UpdatePropertyRequest,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Update a property's details."""
    return property_service.update_property(property_id, data, inspector, db)


@router.delete("/{property_id}", summary="Delete property and its inspections")
def delete_property(
    property_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Delete a property."""
    return property_service.delete_property(property_id, inspector, db)



# ── Property History (inspections over time) ──────────────────────────────
from app.services.inspection_service import get_property_history


@router.get("/{property_id}/history", summary="Get inspection history for a property")
def get_property_history(
    property_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Get all inspections for a property over time."""
    return get_property_history(property_id, inspector, db)
