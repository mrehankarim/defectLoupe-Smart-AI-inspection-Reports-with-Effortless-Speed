"""API routes for observation management."""
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from shared.db_config import get_db
from shared.auth_deps import get_current_inspector
from app.api.dtos.observation_dto import (
    CreateTextObservationRequest,
    ObservationResponse,
)
from app.services import observation_service

router = APIRouter(tags=["observations"])


@router.post(
    "/api/v1/areas/{area_id}/observations",
    response_model=ObservationResponse,
    status_code=201,
    summary="Create a text observation for an area",
)
def create_text_observation(
    area_id: UUID,
    data: CreateTextObservationRequest,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Create a text observation linked to an inspection area."""
    return observation_service.create_text_observation(area_id, data, db)


@router.post(
    "/api/v1/photos/{photo_id}/observations",
    response_model=ObservationResponse,
    status_code=201,
    summary="Create a text observation on a photo",
)
def create_photo_observation(
    photo_id: UUID,
    data: CreateTextObservationRequest,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Create a text observation linked to a specific photo."""
    return observation_service.create_text_observation_on_photo(photo_id, data, db)


@router.post(
    "/api/v1/observations",
    response_model=ObservationResponse,
    status_code=201,
    summary="Create a voice observation (multipart audio)",
)
async def create_voice_observation(
    area_id: UUID = Form(...),
    audio: UploadFile = File(...),
    observation_text: str | None = Form(None),
    photo_id: UUID | None = Form(None),
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Upload an audio file (multipart) and create a voice observation."""
    return await observation_service.create_voice_observation(
        area_id=area_id,
        audio_file=audio,
        note=observation_text,
        photo_id=photo_id,
        db=db,
    )


@router.get(
    "/api/v1/areas/{area_id}/observations",
    response_model=list[ObservationResponse],
    summary="List observations for an area",
)
def list_observations(
    area_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Return all observations for an area with nested transcriptions."""
    return observation_service.list_observations_for_area(area_id, db)
