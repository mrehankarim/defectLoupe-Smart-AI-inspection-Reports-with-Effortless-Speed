"""Business logic for observation management."""
import logging
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.repository.area_observation import AreaObservation, ObservationType
from app.api.dtos.observation_dto import (
    CreateTextObservationRequest,
    ObservationResponse,
)
from app.utils.storage import upload_audio

logger = logging.getLogger(__name__)


def _to_response(obs: AreaObservation) -> ObservationResponse:
    """Convert an ORM object to a response DTO."""
    data = ObservationResponse.model_validate(obs)
    return data


def create_text_observation(
    area_id: UUID,
    data: CreateTextObservationRequest,
    db: Session,
) -> ObservationResponse:
    """Create a text observation linked to an area (and optionally a photo)."""
    obs = AreaObservation(
        inspection_area_id=area_id,
        photo_id=data.photo_id,
        observation_type=ObservationType.TEXT,
        observation_text=data.observation_text,
    )
    db.add(obs)
    db.commit()
    db.refresh(obs)

    logger.info("Created text observation %s for area %s", obs.id, area_id)
    return _to_response(obs)


def create_text_observation_on_photo(
    photo_id: UUID,
    data: CreateTextObservationRequest,
    db: Session,
) -> ObservationResponse:
    """Create a text observation linked to a specific photo.

    The area_id is derived from the photo's inspection_area_id.
    """
    from app.repository.area_photo import AreaPhoto

    photo = db.get(AreaPhoto, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found",
        )

    obs = AreaObservation(
        inspection_area_id=photo.inspection_area_id,
        photo_id=photo_id,
        observation_type=ObservationType.TEXT,
        observation_text=data.observation_text,
    )
    db.add(obs)
    db.commit()
    db.refresh(obs)

    logger.info("Created text observation %s on photo %s", obs.id, photo_id)
    return _to_response(obs)


async def create_voice_observation(
    area_id: UUID,
    audio_file: UploadFile,
    note: str | None,
    photo_id: UUID | None,
    db: Session,
) -> ObservationResponse:
    """Upload audio to Cloudinary and create a VOICE observation."""
    audio_url = await upload_audio(audio_file)

    obs = AreaObservation(
        inspection_area_id=area_id,
        photo_id=photo_id,
        observation_type=ObservationType.VOICE,
        observation_text=note,
        audio_url=audio_url,
    )
    db.add(obs)
    db.commit()
    db.refresh(obs)

    logger.info("Created voice observation %s for area %s", obs.id, area_id)
    return _to_response(obs)


def list_observations_for_area(
    area_id: UUID,
    db: Session,
) -> list[ObservationResponse]:
    """Return all observations for an area, newest first."""
    rows = db.execute(
        select(AreaObservation)
        .where(AreaObservation.inspection_area_id == area_id)
        .options(selectinload(AreaObservation.transcription))
        .order_by(AreaObservation.created_at.desc())
    ).scalars().all()

    return [_to_response(r) for r in rows]


def get_observation(
    observation_id: UUID,
    db: Session,
) -> AreaObservation:
    """Fetch a single observation by ID. Raises 404 if not found."""
    obs = db.execute(
        select(AreaObservation)
        .where(AreaObservation.id == observation_id)
        .options(selectinload(AreaObservation.transcription))
    ).scalar_one_or_none()

    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Observation not found",
        )
    return obs
