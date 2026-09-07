"""Pydantic v2 DTOs for the Report Generation endpoints."""
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReportJobResponse(BaseModel):
    """Response after creating a report generation job."""
    job_id: UUID
    inspection_id: UUID
    status: str
    verify_token: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportStatusResponse(BaseModel):
    """Status check response for a report job."""
    job_id: UUID
    status: str
    pdf_url: str | None = None
    verify_token: str | None = None
    error_message: str | None = None

    model_config = ConfigDict(from_attributes=True)
