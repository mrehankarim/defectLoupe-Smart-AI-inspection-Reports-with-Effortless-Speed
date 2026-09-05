"""Business logic for InspectionArea management, including reorder and templates."""
import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repository.inspection_area import InspectionArea
from app.repository.inspection import Inspection
from app.repository.client import Client
from app.repository.property import Property
from app.api.dtos.area_dto import (
    CreateAreaRequest,
    UpdateAreaRequest,
    AreaResponse,
)

logger = logging.getLogger(__name__)

# Pre-defined area templates
AREA_TEMPLATES: dict[str, list[str]] = {
    "standard_residential": [
        "Roof", "Foundation", "Exterior Walls", "Interior Walls",
        "Kitchen", "Bathrooms", "Electrical Panel", "HVAC",
        "Plumbing", "Garage", "Windows & Doors", "Flooring",
    ],
    "commercial": [
        "Roof", "Foundation", "Exterior", "Lobby & Common Areas",
        "Office Spaces", "Restrooms", "Electrical Systems",
        "HVAC", "Plumbing", "Fire Safety", "Parking Structure",
        "Loading Dock", "Elevator", "Storage Areas",
    ],
    "pre_purchase": [
        "Roof", "Foundation", "Exterior", "Interior",
        "Kitchen", "Bathrooms", "Electrical", "Plumbing",
        "HVAC", "Windows & Doors", "Insulation",
        "Garage", "Drainage & Grading",
    ],
}


def add_area(
    inspection_id: UUID,
    data: CreateAreaRequest,
    inspector,
    db: Session,
) -> AreaResponse:
    """Add a new area to an inspection."""
    _check_inspection_access(inspection_id, inspector, db)

    # Auto-assign display_order if not provided
    if data.display_order is None:
        max_order = db.execute(
            select(InspectionArea.display_order)
            .where(InspectionArea.inspection_id == inspection_id)
            .order_by(InspectionArea.display_order.desc())
            .limit(1)
        ).scalar_one_or_none()
        data.display_order = (max_order or 0) + 1

    area = InspectionArea(
        inspection_id=inspection_id,
        name=data.name,
        display_order=data.display_order,
    )
    db.add(area)
    db.commit()
    db.refresh(area)
    return AreaResponse.model_validate(area)


def list_areas(
    inspection_id: UUID,
    inspector,
    db: Session,
) -> list[AreaResponse]:
    """List all areas for an inspection, ordered by display_order."""
    _check_inspection_access(inspection_id, inspector, db)

    areas = db.execute(
        select(InspectionArea)
        .where(InspectionArea.inspection_id == inspection_id)
        .order_by(InspectionArea.display_order)
    ).scalars().all()

    return [AreaResponse.model_validate(a) for a in areas]


def reorder_areas(
    inspection_id: UUID,
    area_ids: list[UUID],
    inspector,
    db: Session,
) -> list[AreaResponse]:
    """Reorder areas by assigning display_order based on the given list order."""
    _check_inspection_access(inspection_id, inspector, db)

    # Fetch all areas for this inspection
    areas = db.execute(
        select(InspectionArea)
        .where(InspectionArea.inspection_id == inspection_id)
    ).scalars().all()

    area_map = {str(a.id): a for a in areas}

    for idx, area_id in enumerate(area_ids, start=1):
        area_key = str(area_id)
        if area_key not in area_map:
            raise HTTPException(
                status_code=400,
                detail=f"Area {area_id} does not belong to this inspection",
            )
        area_map[area_key].display_order = idx

    db.commit()

    # Return updated list
    updated = db.execute(
        select(InspectionArea)
        .where(InspectionArea.inspection_id == inspection_id)
        .order_by(InspectionArea.display_order)
    ).scalars().all()

    return [AreaResponse.model_validate(a) for a in updated]


def delete_area(
    area_id: UUID,
    inspector,
    db: Session,
) -> dict:
    """Remove an area from an inspection."""
    area = db.get(InspectionArea, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    _check_inspection_access(area.inspection_id, inspector, db)

    db.delete(area)
    db.commit()
    return {"message": "Area deleted successfully"}


def update_area(
    area_id: UUID,
    data: UpdateAreaRequest,
    inspector,
    db: Session,
) -> AreaResponse:
    """Rename or update an inspection area."""
    area = db.get(InspectionArea, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    _check_inspection_access(area.inspection_id, inspector, db)

    if data.name is not None:
        area.name = data.name
    db.commit()
    db.refresh(area)
    return AreaResponse.model_validate(area)


def create_areas_from_template(
    inspection_id: UUID,
    template_name: str,
    inspector,
    db: Session,
) -> list[AreaResponse]:
    """Create multiple areas from a pre-defined template."""
    template_key = template_name.lower().replace(" ", "_")
    area_names = AREA_TEMPLATES.get(template_key)
    if not area_names:
        raise HTTPException(
            status_code=400,
            detail=f"Template '{template_name}' not found. "
                   f"Available: {list(AREA_TEMPLATES.keys())}",
        )

    _check_inspection_access(inspection_id, inspector, db)

    created = []
    for idx, name in enumerate(area_names, start=1):
        area = InspectionArea(
            inspection_id=inspection_id,
            name=name,
            display_order=idx,
        )
        db.add(area)
        created.append(area)

    db.commit()
    for a in created:
        db.refresh(a)

    return [AreaResponse.model_validate(a) for a in created]


def list_templates() -> dict[str, list[str]]:
    """Return all available area templates."""
    return AREA_TEMPLATES


# ── Helpers ───────────────────────────────────────────────────────────────


def _check_inspection_access(inspection_id: UUID, inspector, db: Session) -> None:
    """Verify the inspector has access to this inspection."""
    inspection = db.get(Inspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    if inspector.company_id:
        from shared._inspector_model import Inspector as InspModel
        company_ids = db.execute(
            select(InspModel.id).where(InspModel.company_id == inspector.company_id)
        ).scalars().all()
        if inspection.inspector_id not in list(company_ids):
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        if inspection.inspector_id != inspector.id:
            raise HTTPException(status_code=403, detail="Access denied")
