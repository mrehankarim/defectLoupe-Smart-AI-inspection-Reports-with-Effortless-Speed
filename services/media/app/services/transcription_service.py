"""Business logic for transcription management."""
import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repository.area_observation import AreaObservation, ObservationType
from app.repository.transcription import Transcription
from app.api.dtos.transcription_dto import (
    TranscriptionResponse,
    TranscriptionStatus,
    TranscriptionStatusResponse,
    UpdateTranscriptionRequest,
)

logger = logging.getLogger(__name__)


def trigger_transcription(
    observation_id: UUID,
    db: Session,
) -> dict:
    """Queue a transcription task for a voice observation.

    Validates the observation exists and is a VOICE type, then publishes
    a Celery task to the ``stt`` queue.
    """
    obs = db.get(AreaObservation, observation_id)
    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Observation not found",
        )
    if obs.observation_type != ObservationType.VOICE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only voice observations can be transcribed",
        )
    if not obs.audio_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Observation has no audio file",
        )

    # Check if a transcription already exists
    existing = db.execute(
        select(Transcription).where(Transcription.observation_id == observation_id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Transcription already exists for this observation",
        )

    # Publish Celery task
    from app.celery_app import celery_app
    celery_app.send_task(
        "app.workers.transcribe_worker.transcribe_audio",
        args=[str(observation_id), obs.audio_url],
        queue="stt",
    )

    logger.info("Queued transcription for observation %s", observation_id)
    return {
        "observation_id": str(observation_id),
        "status": TranscriptionStatus.PENDING.value,
        "message": "Transcription task queued",
    }


def get_transcription(
    transcription_id: UUID,
    db: Session,
) -> TranscriptionResponse:
    """Fetch a transcription by its ID."""
    txn = db.get(Transcription, transcription_id)
    if not txn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcription not found",
        )
    return TranscriptionResponse.model_validate(txn)


def update_transcription(
    transcription_id: UUID,
    data: UpdateTranscriptionRequest,
    db: Session,
) -> TranscriptionResponse:
    """Apply a manual correction to an existing transcription."""
    txn = db.get(Transcription, transcription_id)
    if not txn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcription not found",
        )

    txn.transcription_text = data.transcription_text
    db.commit()
    db.refresh(txn)

    logger.info("Updated transcription %s", transcription_id)
    return TranscriptionResponse.model_validate(txn)


def get_transcription_status(
    observation_id: UUID,
    db: Session,
) -> TranscriptionStatusResponse:
    """Check the processing status of a transcription for a given observation."""
    obs = db.get(AreaObservation, observation_id)
    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Observation not found",
        )

    txn = db.execute(
        select(Transcription).where(Transcription.observation_id == observation_id)
    ).scalar_one_or_none()

    if not txn:
        # No transcription row yet — could be pending or failed
        return TranscriptionStatusResponse(
            observation_id=observation_id,
            status=TranscriptionStatus.PENDING,
        )

    return TranscriptionStatusResponse(
        observation_id=observation_id,
        status=TranscriptionStatus.COMPLETED,
        transcription=TranscriptionResponse.model_validate(txn),
    )


def get_all_media_for_inspection(
    inspection_id: UUID,
    db: Session,
) -> list[dict]:
    """Return all photos + observations grouped by area for an inspection.

    Accepts inspection_id as a UUID — queries the shared DB directly
    (independence contract: no HTTP call to core-service).
    """
    from app.repository.area_photo import AreaPhoto
    from sqlalchemy.orm import selectinload

    # Find all areas for this inspection (query shared DB)
    from sqlalchemy import text
    area_rows = db.execute(
        text("SELECT id, name FROM inspection_areas WHERE inspection_id = :iid ORDER BY display_order"),
        {"iid": str(inspection_id)},
    ).fetchall()

    result = []
    for area_row in area_rows:
        area_id = area_row[0]
        area_name = area_row[1]

        photos = db.execute(
            select(AreaPhoto)
            .where(AreaPhoto.inspection_area_id == area_id)
            .order_by(AreaPhoto.created_at.desc())
        ).scalars().all()

        observations = db.execute(
            select(AreaObservation)
            .where(AreaObservation.inspection_area_id == area_id)
            .options(selectinload(AreaObservation.transcription))
            .order_by(AreaObservation.created_at.desc())
        ).scalars().all()

        result.append({
            "area_id": area_id,
            "area_name": area_name,
            "photos": [
                {
                    "id": str(p.id),
                    "photo_url": p.photo_url,
                    "created_at": p.created_at.isoformat(),
                }
                for p in photos
            ],
            "observations": [
                {
                    "id": str(o.id),
                    "observation_type": o.observation_type.value,
                    "observation_text": o.observation_text,
                    "audio_url": o.audio_url,
                    "created_at": o.created_at.isoformat(),
                    "transcription": (
                        {
                            "id": str(o.transcription.id),
                            "text": o.transcription.transcription_text,
                            "confidence": o.transcription.confidence,
                        }
                        if o.transcription else None
                    ),
                }
                for o in observations
            ],
        })

    return result
