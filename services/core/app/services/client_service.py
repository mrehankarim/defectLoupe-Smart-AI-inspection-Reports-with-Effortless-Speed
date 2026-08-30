"""Business logic for the Client resource."""
import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, func as sa_func
from sqlalchemy.orm import Session

from app.repository.client import Client
from app.api.dtos.client_dto import (
    CreateClientRequest,
    UpdateClientRequest,
    ClientResponse,
    ClientListResponse,
)

logger = logging.getLogger(__name__)


def create_client(
    data: CreateClientRequest,
    inspector,
    db: Session,
) -> ClientResponse:
    """Create a new client, scoped to the inspector or their company."""
    # Check for duplicate email within the tenant scope
    existing = db.execute(
        select(Client).where(Client.email == data.email)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A client with this email already exists",
        )

    client = Client(
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        phone_number=data.phone_number,
        inspector_id=inspector.id,
        company_id=inspector.company_id,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return ClientResponse.model_validate(client)


def list_clients(
    inspector,
    db: Session,
    skip: int = 0,
    limit: int = 50,
    search: str | None = None,
) -> ClientListResponse:
    """List clients scoped to the inspector or their company."""
    query = select(Client)

    # Tenant scoping
    if inspector.company_id:
        query = query.where(Client.company_id == inspector.company_id)
    else:
        query = query.where(Client.inspector_id == inspector.id)

    # Optional search by name or email
    if search:
        pattern = f"%{search}%"
        query = query.where(
            (Client.first_name.ilike(pattern))
            | (Client.last_name.ilike(pattern))
            | (Client.email.ilike(pattern))
        )

    # Count total
    count_query = select(sa_func.count()).select_from(query.subquery())
    total = db.execute(count_query).scalar()

    # Paginate
    query = query.order_by(Client.created_at.desc()).offset(skip).limit(limit)
    clients = db.execute(query).scalars().all()

    return ClientListResponse(
        items=[ClientResponse.model_validate(c) for c in clients],
        total=total,
    )


def get_client(
    client_id: UUID,
    inspector,
    db: Session,
) -> ClientResponse:
    """Get a single client by ID, ensuring tenant scope."""
    client = _get_scoped_client(client_id, inspector, db)
    return ClientResponse.model_validate(client)


def update_client(
    client_id: UUID,
    data: UpdateClientRequest,
    inspector,
    db: Session,
) -> ClientResponse:
    """Update a client's details."""
    client = _get_scoped_client(client_id, inspector, db)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)

    db.commit()
    db.refresh(client)
    return ClientResponse.model_validate(client)


def delete_client(
    client_id: UUID,
    inspector,
    db: Session,
) -> dict:
    """Delete a client and all their properties (cascade)."""
    client = _get_scoped_client(client_id, inspector, db)
    db.delete(client)
    db.commit()
    return {"message": "Client deleted successfully"}


def _get_scoped_client(client_id: UUID, inspector, db: Session) -> Client:
    """Fetch a client and verify it belongs to the current tenant."""
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    # Tenant check
    if inspector.company_id:
        if client.company_id != inspector.company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this client",
            )
    else:
        if client.inspector_id != inspector.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this client",
            )

    return client
