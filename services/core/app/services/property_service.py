"""Business logic for the Property resource."""
import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, func as sa_func
from sqlalchemy.orm import Session

from app.repository.property import Property
from app.repository.client import Client
from app.api.dtos.property_dto import (
    CreatePropertyRequest,
    UpdatePropertyRequest,
    PropertyResponse,
    PropertyListResponse,
)

logger = logging.getLogger(__name__)


def create_property(
    data: CreatePropertyRequest,
    inspector,
    db: Session,
) -> PropertyResponse:
    """Create a property linked to a client within the tenant scope."""
    # Verify the client exists and belongs to this tenant
    client = db.get(Client, data.client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    _check_client_tenant(client, inspector)

    prop = Property(
        client_id=data.client_id,
        address=data.address,
        city=data.city,
        state=data.state,
        zip_code=data.zip_code,
        country=data.country,
        property_type=data.property_type,
        year_built=data.year_built,
        square_footage=data.square_footage,
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return PropertyResponse.model_validate(prop)


def list_properties(
    inspector,
    db: Session,
    client_id: UUID | None = None,
    skip: int = 0,
    limit: int = 50,
    search: str | None = None,
) -> PropertyListResponse:
    """List properties, optionally filtered by client."""
    # First get all client IDs in this tenant
    tenant_client_ids = _get_tenant_client_ids(inspector, db)

    query = select(Property).where(Property.client_id.in_(tenant_client_ids))

    if client_id:
        query = query.where(Property.client_id == client_id)

    if search:
        pattern = f"%{search}%"
        query = query.where(
            (Property.address.ilike(pattern))
            | (Property.city.ilike(pattern))
        )

    count_query = select(sa_func.count()).select_from(query.subquery())
    total = db.execute(count_query).scalar()

    query = query.order_by(Property.created_at.desc()).offset(skip).limit(limit)
    props = db.execute(query).scalars().all()

    return PropertyListResponse(
        items=[PropertyResponse.model_validate(p) for p in props],
        total=total,
    )


def get_property(
    property_id: UUID,
    inspector,
    db: Session,
) -> PropertyResponse:
    """Get a single property by ID."""
    prop = _get_scoped_property(property_id, inspector, db)
    return PropertyResponse.model_validate(prop)


def update_property(
    property_id: UUID,
    data: UpdatePropertyRequest,
    inspector,
    db: Session,
) -> PropertyResponse:
    """Update a property's details."""
    prop = _get_scoped_property(property_id, inspector, db)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prop, field, value)
    db.commit()
    db.refresh(prop)
    return PropertyResponse.model_validate(prop)


def delete_property(
    property_id: UUID,
    inspector,
    db: Session,
) -> dict:
    """Delete a property and its inspections (cascade)."""
    prop = _get_scoped_property(property_id, inspector, db)
    db.delete(prop)
    db.commit()
    return {"message": "Property deleted successfully"}


def list_client_properties(
    client_id: UUID,
    inspector,
    db: Session,
) -> list[PropertyResponse]:
    """List all properties for a specific client."""
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    _check_client_tenant(client, inspector)

    props = db.execute(
        select(Property)
        .where(Property.client_id == client_id)
        .order_by(Property.created_at.desc())
    ).scalars().all()
    return [PropertyResponse.model_validate(p) for p in props]


# ── Helpers ───────────────────────────────────────────────────────────────


def _get_tenant_client_ids(inspector, db: Session) -> list:
    """Get all client IDs visible to this tenant."""
    if inspector.company_id:
        rows = db.execute(
            select(Client.id).where(Client.company_id == inspector.company_id)
        ).scalars().all()
    else:
        rows = db.execute(
            select(Client.id).where(Client.inspector_id == inspector.id)
        ).scalars().all()
    return list(rows)


def _check_client_tenant(client: Client, inspector) -> None:
    """Verify a client belongs to the current tenant."""
    if inspector.company_id:
        if client.company_id != inspector.company_id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        if client.inspector_id != inspector.id:
            raise HTTPException(status_code=403, detail="Access denied")


def _get_scoped_property(property_id: UUID, inspector, db: Session) -> Property:
    """Fetch a property and verify tenant access."""
    prop = db.get(Property, property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    client = db.get(Client, prop.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    _check_client_tenant(client, inspector)
    return prop
