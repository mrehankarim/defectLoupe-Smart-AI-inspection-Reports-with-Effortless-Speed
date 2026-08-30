"""Pydantic DTOs for the Inspection resource."""
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.repository.inspection import InspectionStatus


class CreateInspectionRequest(BaseModel):
    property_id: UUID
    title: str | None = None
    notes: str | None = None


class UpdateInspectionStatusRequest(BaseModel):
    status: InspectionStatus


class UpdateInspectionRequest(BaseModel):
    title: str | None = None
    notes: str | None = None
    status: InspectionStatus | None = None


class InspectionResponse(BaseModel):
    id: UUID
    inspector_id: UUID
    property_id: UUID
    title: str | None = None
    status: InspectionStatus
    notes: str | None = None
    report_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InspectionListResponse(BaseModel):
    items: list[InspectionResponse]
    total: int


class InspectionFullContextResponse(BaseModel):
    """Aggregated inspection data for reports and mobile."""
    inspection: InspectionResponse
    areas: list[dict]
