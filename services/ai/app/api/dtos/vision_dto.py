"""Pydantic v2 DTOs for the Vision AI Analysis endpoints."""
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AnalysisResponse(BaseModel):
    """Response schema for a photo defect analysis."""
    id: UUID
    photo_id: UUID
    defect_labels: list[str] | dict
    severity: str = Field(description="One of: Low, Medium, High, Critical")
    description: str
    remediation: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
