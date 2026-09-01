"""Pydantic v2 DTO for the public report verification endpoint."""
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel


class ReportVerificationResponse(BaseModel):
    """Response schema for public report verification."""
    valid: bool
    verify_token: str
    inspection_id: UUID | None = None
    status: str
    completed_at: datetime | None = None
    summary: dict | None = None
    error: str | None = None
