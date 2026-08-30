"""API routes for InspectionArea management."""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.db_config import get_db
from shared.auth_deps import get_current_inspector
from app.api.dtos.area_dto import (
    CreateAreaRequest,
    ReorderAreasRequest,
    AreaResponse,
    AreaTemplateRequest,
)
from app.services import area_service

router = APIRouter(tags=["areas"])


# ── Area CRUD under inspection ────────────────────────────────────────────


@router.post(
    "/api/v1/inspections/{inspection_id}/areas",
    response_model=AreaResponse,
    status_code=201,
)
def add_area(
    inspection_id: UUID,
    data: CreateAreaRequest,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Add a new area to an inspection."""
    return area_service.add_area(inspection_id, data, inspector, db)


@router.get(
    "/api/v1/inspections/{inspection_id}/areas",
    response_model=list[AreaResponse],
)
def list_areas(
    inspection_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """List all areas for an inspection."""
    return area_service.list_areas(inspection_id, inspector, db)


@router.put(
    "/api/v1/inspections/{inspection_id}/areas/reorder",
    response_model=list[AreaResponse],
)
def reorder_areas(
    inspection_id: UUID,
    data: ReorderAreasRequest,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Reorder areas by providing the desired order of area IDs."""
    return area_service.reorder_areas(inspection_id, data.area_ids, inspector, db)


@router.delete("/api/v1/areas/{area_id}")
def delete_area(
    area_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Remove an area from an inspection."""
    return area_service.delete_area(area_id, inspector, db)


# ── Templates ─────────────────────────────────────────────────────────────


@router.post(
    "/api/v1/inspections/{inspection_id}/areas/template",
    response_model=list[AreaResponse],
    status_code=201,
)
def create_from_template(
    inspection_id: UUID,
    data: AreaTemplateRequest,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Create multiple areas from a pre-defined template."""
    return area_service.create_areas_from_template(
        inspection_id, data.template_name, inspector, db,
    )


@router.get("/api/v1/area-templates")
def list_templates():
    """List all available area templates."""
    return area_service.list_templates()
