"""Pydantic DTOs for observation resources."""
from uuid import UUID
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class ObservationType(str, Enum):
    TEXT = "text"
    VOICE = "voice"


class CreateTextObservationRequest(BaseModel):
    observation_text: str = Field(min_length=1, max_length=5000)
    photo_id: UUID | None = None


class CreateVoiceObservationRequest(BaseModel):
    """Metadata sent alongside the audio file (form fields)."""
    observation_text: str | None = None
    photo_id: UUID | None = None


class ObservationResponse(BaseModel):
    id: UUID
    inspection_area_id: UUID
    photo_id: UUID | None
    observation_type: ObservationType
    observation_text: str | None
    audio_url: str | None
    created_at: datetime
    updated_at: datetime

    # Nested transcription (if available)
    transcription: "TranscriptionBrief | None" = None

    model_config = ConfigDict(from_attributes=True)


class TranscriptionBrief(BaseModel):
    id: UUID
    transcription_text: str
    confidence: float | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ObservationListResponse(BaseModel):
    observations: list[ObservationResponse]
