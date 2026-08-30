"""Business logic for the Inspection resource, including status state machine."""
import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, func as sa_func
from sqlalchemy.orm import Session

from app.repository.inspection import Inspection, InspectionStatus
from app.repository.inspection_area import InspectionArea
from app.repository.property import Property
from app.repository.client import Client
from app.api.dtos.inspection_dto import (
    CreateInspectionRequest,
    UpdateInspectionRequest,
    InspectionResponse,
    InspectionListResponse,
)

logger = logging.getLogger(__name__)

# Valid state transitions
VALID_TRANSITIONS: dict[InspectionStatus, list[InspectionStatus]] = {
    InspectionStatus.DRAFT: [InspectionStatus.SCHEDULED, InspectionStatus.CANCELLED],
    InspectionStatus.SCHEDULED: [InspectionStatus.IN_PROGRESS, InspectionStatus.CANCELLED],
    InspectionStatus.IN_PROGRESS: [InspectionStatus.COMPLETED, InspectionStatus.CANCELLED],
    InspectionStatus.COMPLETED: [InspectionStatus.REPORT_GENERATED],
    InspectionStatus.REPORT_GENERATED: [InspectionStatus.ARCHIVED],
    InspectionStatus.ARCHIVED: [],
    InspectionStatus.CANCELLED: [],
}


def create_inspection(
    data: CreateInspectionRequest,
    inspector,
    db: Session,
) -> InspectionResponse:
    """Create a new inspection linked to a property within the tenant."""
    prop = db.get(Property, data.property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    _check_property_tenant(prop, inspector, db)

    inspection = Inspection(
        inspector_id=inspector.id,
        property_id=data.property_id,
        title=data.title,
        notes=data.notes,
        status=InspectionStatus.DRAFT,
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    return InspectionResponse.model_validate(inspection)


def list_inspections(
    inspector,
    db: Session,
    status_filter: InspectionStatus | None = None,
    property_id: UUID | None = None,
    client_id: UUID | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    skip: int = 0,
    limit: int = 50,
    search: str | None = None,
) -> InspectionListResponse:
    """List inspections scoped to the inspector or their company."""
    query = select(Inspection)

    # Tenant scoping via inspector
    if inspector.company_id:
        # For agency: get all inspectors in the company
        from shared._inspector_model import Inspector as InspModel
        company_inspector_ids = db.execute(
            select(InspModel.id).where(InspModel.company_id == inspector.company_id)
        ).scalars().all()
        query = query.where(Inspection.inspector_id.in_(list(company_inspector_ids)))
    else:
        query = query.where(Inspection.inspector_id == inspector.id)

    if status_filter:
        query = query.where(Inspection.status == status_filter)
    if property_id:
        query = query.where(Inspection.property_id == property_id)
    if client_id:
        # Filter by properties belonging to this client
        query = query.where(
            Inspection.property_id.in_(
                select(Property.id).where(Property.client_id == client_id)
            )
        )
    if date_from:
        from datetime import datetime as dt
        query = query.where(Inspection.created_at >= dt.fromisoformat(date_from))
    if date_to:
        from datetime import datetime as dt
        query = query.where(Inspection.created_at <= dt.fromisoformat(date_to))
    if search:
        pattern = f"%{search}%"
        query = query.where(Inspection.title.ilike(pattern))

    count_query = select(sa_func.count()).select_from(query.subquery())
    total = db.execute(count_query).scalar()

    query = query.order_by(Inspection.created_at.desc()).offset(skip).limit(limit)
    inspections = db.execute(query).scalars().all()

    return InspectionListResponse(
        items=[InspectionResponse.model_validate(i) for i in inspections],
        total=total,
    )


def get_inspection(
    inspection_id: UUID,
    inspector,
    db: Session,
) -> InspectionResponse:
    """Get a single inspection by ID."""
    inspection = _get_scoped_inspection(inspection_id, inspector, db)
    return InspectionResponse.model_validate(inspection)


def update_inspection(
    inspection_id: UUID,
    data: UpdateInspectionRequest,
    inspector,
    db: Session,
) -> InspectionResponse:
    """Update inspection details and optionally transition status."""
    inspection = _get_scoped_inspection(inspection_id, inspector, db)
    update_data = data.model_dump(exclude_unset=True)

    # Handle status transition separately with validation
    if "status" in update_data and update_data["status"] is not None:
        new_status = update_data.pop("status")
        _validate_transition(inspection.status, new_status)
        inspection.status = new_status

    for field, value in update_data.items():
        setattr(inspection, field, value)

    db.commit()
    db.refresh(inspection)
    return InspectionResponse.model_validate(inspection)


def get_full_context(
    inspection_id: UUID,
    inspector,
    db: Session,
) -> dict:
    """Return aggregated inspection data for reports and mobile."""
    inspection = _get_scoped_inspection(inspection_id, inspector, db)

    areas = db.execute(
        select(InspectionArea)
        .where(InspectionArea.inspection_id == inspection_id)
        .order_by(InspectionArea.display_order)
    ).scalars().all()

    return {
        "inspection": InspectionResponse.model_validate(inspection),
        "areas": [
            {
                "id": str(a.id),
                "name": a.name,
                "display_order": a.display_order,
            }
            for a in areas
        ],
    }


def get_property_history(
    property_id: UUID,
    inspector,
    db: Session,
) -> list[InspectionResponse]:
    """Get all inspections for a property over time (tenant-scoped)."""
    prop = db.get(Property, property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    _check_property_tenant(prop, inspector, db)

    inspections = db.execute(
        select(Inspection)
        .where(Inspection.property_id == property_id)
        .order_by(Inspection.created_at.desc())
    ).scalars().all()

    return [InspectionResponse.model_validate(i) for i in inspections]


# ── State Machine ─────────────────────────────────────────────────────────


def _validate_transition(current: InspectionStatus, new: InspectionStatus) -> None:
    """Ensure the status transition is valid."""
    allowed = VALID_TRANSITIONS.get(current, [])
    if new not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from {current.value} to {new.value}. "
                   f"Allowed: {[s.value for s in allowed]}",
        )


# ── Helpers ───────────────────────────────────────────────────────────────


def _check_property_tenant(prop: Property, inspector, db: Session) -> None:
    client = db.get(Client, prop.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    if inspector.company_id:
        if client.company_id != inspector.company_id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        if client.inspector_id != inspector.id:
            raise HTTPException(status_code=403, detail="Access denied")


def _get_scoped_inspection(inspection_id: UUID, inspector, db: Session) -> Inspection:
    inspection = db.get(Inspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    # Tenant check
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

    return inspection
