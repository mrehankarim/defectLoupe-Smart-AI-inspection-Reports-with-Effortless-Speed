"""API routes for custom AreaTemplate CRUD."""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.db_config import get_db
from shared.auth_deps import get_current_inspector
from app.api.dtos.area_template_dto import (
    CreateAreaTemplateRequest,
    UpdateAreaTemplateRequest,
    AreaTemplateResponse,
)
from app.services import template_service

router = APIRouter(prefix="/api/v1/templates", tags=["templates"])


@router.post("", response_model=AreaTemplateResponse, status_code=201)
def create_template(
    data: CreateAreaTemplateRequest,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Create a custom area template."""
    return template_service.create_template(data, inspector, db)


@router.get("", response_model=list[AreaTemplateResponse])
def list_templates(
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """List all templates visible to this user."""
    return template_service.list_templates(inspector, db)


@router.get("/{template_id}", response_model=AreaTemplateResponse)
def get_template(
    template_id: UUID,
    db: Session = Depends(get_db),
):
    """Get a single template."""
    return template_service.get_template(template_id, db)


@router.patch("/{template_id}", response_model=AreaTemplateResponse)
def update_template(
    template_id: UUID,
    data: UpdateAreaTemplateRequest,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Update a custom template."""
    return template_service.update_template(template_id, data, inspector, db)


@router.delete("/{template_id}")
def delete_template(
    template_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Delete a custom template."""
    return template_service.delete_template(template_id, inspector, db)
