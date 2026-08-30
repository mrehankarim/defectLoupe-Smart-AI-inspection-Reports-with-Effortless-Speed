"""DTOs for the custom AreaTemplate resource."""
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class CreateAreaTemplateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    area_names: list[str] = Field(min_length=1)


class UpdateAreaTemplateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    area_names: list[str] | None = None


class AreaTemplateResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    area_names: list[str]
    inspector_id: UUID | None = None
    company_id: UUID | None = None
    is_global: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
