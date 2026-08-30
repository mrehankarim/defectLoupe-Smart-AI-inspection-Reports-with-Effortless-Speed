"""Business logic for custom AreaTemplate CRUD."""
import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repository.area_template import AreaTemplate
from app.repository.inspection_area import InspectionArea
from app.repository.inspection import Inspection
from app.api.dtos.area_template_dto import (
    CreateAreaTemplateRequest,
    UpdateAreaTemplateRequest,
    AreaTemplateResponse,
)

logger = logging.getLogger(__name__)


def create_template(
    data: CreateAreaTemplateRequest,
    inspector,
    db: Session,
) -> AreaTemplateResponse:
    """Create a custom area template."""
    template = AreaTemplate(
        name=data.name,
        description=data.description,
        area_names=data.area_names,
        inspector_id=inspector.id,
        company_id=inspector.company_id,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return AreaTemplateResponse.model_validate(template)


def list_templates(
    inspector,
    db: Session,
) -> list[AreaTemplateResponse]:
    """List all templates visible to this user: own + global + company."""
    query = select(AreaTemplate).where(
        (AreaTemplate.is_global == True)  # noqa: E712
        | (AreaTemplate.inspector_id == inspector.id)
    )
    if inspector.company_id:
        query = select(AreaTemplate).where(
            (AreaTemplate.is_global == True)  # noqa: E712
            | (AreaTemplate.company_id == inspector.company_id)
        )

    templates = db.execute(query.order_by(AreaTemplate.name)).scalars().all()
    return [AreaTemplateResponse.model_validate(t) for t in templates]


def get_template(
    template_id: UUID,
    db: Session,
) -> AreaTemplateResponse:
    """Get a single template by ID."""
    template = db.get(AreaTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return AreaTemplateResponse.model_validate(template)


def update_template(
    template_id: UUID,
    data: UpdateAreaTemplateRequest,
    inspector,
    db: Session,
) -> AreaTemplateResponse:
    """Update a custom template (only by its creator)."""
    template = _get_owned_template(template_id, inspector, db)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    db.commit()
    db.refresh(template)
    return AreaTemplateResponse.model_validate(template)


def delete_template(
    template_id: UUID,
    inspector,
    db: Session,
) -> dict:
    """Delete a custom template (only by its creator)."""
    template = _get_owned_template(template_id, inspector, db)
    db.delete(template)
    db.commit()
    return {"message": "Template deleted"}


def apply_template_to_inspection(
    inspection_id: UUID,
    template_id: UUID,
    inspector,
    db: Session,
) -> list[dict]:
    """Apply a custom or built-in template's areas to an inspection."""
    template = db.get(AreaTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Verify inspection access
    inspection = db.get(Inspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    if inspector.company_id:
        from shared._inspector_model import Inspector as InspModel
        company_ids = list(db.execute(
            select(InspModel.id).where(InspModel.company_id == inspector.company_id)
        ).scalars().all())
        if inspection.inspector_id not in company_ids:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        if inspection.inspector_id != inspector.id:
            raise HTTPException(status_code=403, detail="Access denied")

    created = []
    for idx, name in enumerate(template.area_names, start=1):
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

    return [
        {"id": str(a.id), "name": a.name, "display_order": a.display_order}
        for a in created
    ]


# ── Helpers ───────────────────────────────────────────────────────────────


def _get_owned_template(template_id: UUID, inspector, db: Session) -> AreaTemplate:
    template = db.get(AreaTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    if template.inspector_id != inspector.id and not template.is_global:
        raise HTTPException(status_code=403, detail="Access denied")
    return template
