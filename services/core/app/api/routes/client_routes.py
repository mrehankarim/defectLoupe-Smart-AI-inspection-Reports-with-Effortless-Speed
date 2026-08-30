"""API routes for the Client resource."""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from shared.db_config import get_db
from shared.auth_deps import get_current_inspector
from app.api.dtos.client_dto import (
    CreateClientRequest,
    UpdateClientRequest,
    ClientResponse,
    ClientListResponse,
)
from app.services import client_service

router = APIRouter(prefix="/api/v1/clients", tags=["clients"])


@router.post("", response_model=ClientResponse, status_code=201, summary="Create a new client")
def create_client(
    data: CreateClientRequest,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Create a new client under the logged-in inspector or their company."""
    return client_service.create_client(data, inspector, db)


@router.get("", response_model=ClientListResponse, summary="List clients (tenant-scoped)")
def list_clients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None),
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """List all clients visible to the current inspector/agency."""
    return client_service.list_clients(inspector, db, skip, limit, search)


@router.get("/{client_id}", response_model=ClientResponse, summary="Get client details")
def get_client(
    client_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Get details of a single client."""
    return client_service.get_client(client_id, inspector, db)


@router.patch("/{client_id}", response_model=ClientResponse, summary="Update client details")
def update_client(
    client_id: UUID,
    data: UpdateClientRequest,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Update a client's information."""
    return client_service.update_client(client_id, data, inspector, db)


@router.delete("/{client_id}", summary="Delete client and all their properties")
def delete_client(
    client_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Delete a client and all their properties."""
    return client_service.delete_client(client_id, inspector, db)
