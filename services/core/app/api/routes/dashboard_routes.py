"""Dashboard statistics routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func as sa_func

from shared.db_config import get_db
from shared.auth_deps import get_current_inspector
from app.repository.inspection import Inspection, InspectionStatus
from app.repository.client import Client
from app.repository.property import Property

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Return dashboard statistics for the current tenant."""
    # Get inspector IDs in this tenant
    if inspector.company_id:
        from shared._inspector_model import Inspector as InspModel
        inspector_ids = list(db.execute(
            select(InspModel.id).where(InspModel.company_id == inspector.company_id)
        ).scalars().all())
    else:
        inspector_ids = [inspector.id]

    # Total clients
    if inspector.company_id:
        total_clients = db.execute(
            select(sa_func.count(Client.id)).where(Client.company_id == inspector.company_id)
        ).scalar()
    else:
        total_clients = db.execute(
            select(sa_func.count(Client.id)).where(Client.inspector_id == inspector.id)
        ).scalar()

    # Total properties (via tenant clients)
    client_ids = db.execute(
        select(Client.id).where(Client.id.in_(
            select(Client.id).where(
                (Client.company_id == inspector.company_id) if inspector.company_id
                else (Client.inspector_id == inspector.id)
            )
        ))
    ).scalars().all()

    total_properties = db.execute(
        select(sa_func.count(Property.id)).where(Property.client_id.in_(list(client_ids)))
    ).scalar() if client_ids else 0

    # Inspection counts by status
    inspections_query = select(Inspection).where(
        Inspection.inspector_id.in_(inspector_ids)
    )
    all_inspections = db.execute(inspections_query).scalars().all()

    total_inspections = len(all_inspections)
    status_counts = {}
    for s in InspectionStatus:
        status_counts[s.value] = sum(1 for i in all_inspections if i.status == s)

    # Completion rate
    completed = status_counts.get(InspectionStatus.COMPLETED.value, 0)
    report_gen = status_counts.get(InspectionStatus.REPORT_GENERATED.value, 0)
    archived = status_counts.get(InspectionStatus.ARCHIVED.value, 0)
    finished = completed + report_gen + archived
    completion_rate = (finished / total_inspections * 100) if total_inspections > 0 else 0

    return {
        "total_clients": total_clients,
        "total_properties": total_properties,
        "total_inspections": total_inspections,
        "inspections_by_status": status_counts,
        "completion_rate": round(completion_rate, 1),
    }
