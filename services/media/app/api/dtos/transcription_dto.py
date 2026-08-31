"""Pydantic DTOs for transcription resources."""
from uuid import UUID
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class TranscriptionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class UpdateTranscriptionRequest(BaseModel):
    """Manual correction of a transcription."""
    transcription_text: str = Field(min_length=1, max_length=10000)


class TranscriptionResponse(BaseModel):
    id: UUID
    observation_id: UUID
    transcription_text: str
    confidence: float | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TranscriptionStatusResponse(BaseModel):
    observation_id: UUID
    status: TranscriptionStatus
    transcription: TranscriptionResponse | None = None
    error: str | None = None


class TranscriptionTriggerResponse(BaseModel):
    observation_id: UUID
    status: TranscriptionStatus = TranscriptionStatus.PENDING
    message: str = "Transcription task queued"
