"""Pydantic DTOs for InspectionArea resource."""
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class CreateAreaRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    display_order: int | None = None


class UpdateAreaRequest(BaseModel):
    """Partial update — only provided fields are changed."""
    name: str | None = Field(default=None, min_length=1, max_length=200)
    notes: str | None = None


class ReorderAreasRequest(BaseModel):
    """A list of area IDs in the desired display order."""
    area_ids: list[UUID]


class AreaResponse(BaseModel):
    id: UUID
    inspection_id: UUID
    name: str
    display_order: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AreaTemplateRequest(BaseModel):
    """Create multiple areas from a template name."""
    template_name: str
