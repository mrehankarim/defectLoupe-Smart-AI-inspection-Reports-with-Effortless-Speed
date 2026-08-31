"""API routes for transcription management."""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.db_config import get_db
from shared.auth_deps import get_current_inspector
from app.api.dtos.transcription_dto import (
    TranscriptionResponse,
    TranscriptionStatusResponse,
    UpdateTranscriptionRequest,
)
from app.services import transcription_service

router = APIRouter(tags=["transcriptions"])


@router.post(
    "/api/v1/observations/{observation_id}/transcribe",
    status_code=202,
    summary="Trigger speech-to-text transcription",
)
def trigger_transcription(
    observation_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Queue an async transcription task for a voice observation."""
    return transcription_service.trigger_transcription(observation_id, db)


@router.get(
    "/api/v1/transcriptions/{transcription_id}",
    response_model=TranscriptionResponse,
    summary="Get a transcription",
)
def get_transcription(
    transcription_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Fetch a transcription by its ID."""
    return transcription_service.get_transcription(transcription_id, db)


@router.patch(
    "/api/v1/transcriptions/{transcription_id}",
    response_model=TranscriptionResponse,
    summary="Edit a transcription (manual correction)",
)
def update_transcription(
    transcription_id: UUID,
    data: UpdateTranscriptionRequest,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Apply a manual correction to an existing transcription."""
    return transcription_service.update_transcription(transcription_id, data, db)


@router.get(
    "/api/v1/transcriptions/{observation_id}/status",
    response_model=TranscriptionStatusResponse,
    summary="Check transcription processing status",
)
def get_transcription_status(
    observation_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Check whether a transcription is pending, processing, or completed."""
    return transcription_service.get_transcription_status(observation_id, db)


@router.get(
    "/api/v1/inspections/{inspection_id}/media",
    summary="Get all media for an inspection grouped by area",
)
def get_inspection_media(
    inspection_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Return all photos + voice notes grouped by area for an inspection."""
    return transcription_service.get_all_media_for_inspection(inspection_id, db)
