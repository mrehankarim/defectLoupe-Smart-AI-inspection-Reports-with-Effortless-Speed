"""Photo, observation and transcription API for inspection areas."""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from shared.auth_deps import get_current_inspector
from shared.db_config import get_db
from app.repository.area_photo import AreaPhoto
from app.repository.area_observation import AreaObservation, ObservationType
from app.repository.transcription import Transcription

router = APIRouter(prefix="/api/v1", tags=["media"])


class PhotoCreate(BaseModel):
    inspection_area_id: UUID
    photo_url: str = Field(min_length=1, max_length=4000)


class ObservationCreate(BaseModel):
    inspection_area_id: UUID
    observation_type: ObservationType
    observation_text: str | None = None
    audio_url: str | None = None
    photo_id: UUID | None = None


class TranscriptionCreate(BaseModel):
    transcription_text: str = Field(min_length=1)
    confidence: float | None = Field(default=None, ge=0, le=1)


class PhotoResponse(PhotoCreate):
    id: UUID
    model_config = ConfigDict(from_attributes=True)


class ObservationResponse(ObservationCreate):
    id: UUID
    model_config = ConfigDict(from_attributes=True)


def _assert_area_access(area_id: UUID, inspector, db: Session) -> None:
    """Use the core service's persisted rows to ensure tenant ownership."""
    from app.repository.external_models import InspectionArea
    area = db.get(InspectionArea, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Inspection area not found")
    # The database relation is intentionally verified with a scoped query.  It
    # keeps media private even though its models live in a separate service.
    from sqlalchemy import text
    result = db.execute(text("""
        SELECT i.inspector_id FROM inspections i
        JOIN inspection_areas a ON a.inspection_id = i.id
        WHERE a.id = :area_id
    """), {"area_id": str(area_id)}).scalar_one_or_none()
    if result is None:
        raise HTTPException(status_code=404, detail="Inspection area not found")
    if str(result) != str(inspector.id) and not inspector.company_id:
        raise HTTPException(status_code=403, detail="Not allowed to access this inspection area")


@router.post("/photos", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED)
def create_photo(data: PhotoCreate, inspector=Depends(get_current_inspector), db: Session = Depends(get_db)):
    _assert_area_access(data.inspection_area_id, inspector, db)
    photo = AreaPhoto(**data.model_dump())
    db.add(photo); db.commit(); db.refresh(photo)
    return photo


@router.get("/areas/{area_id}/photos", response_model=list[PhotoResponse])
def list_photos(area_id: UUID, inspector=Depends(get_current_inspector), db: Session = Depends(get_db)):
    _assert_area_access(area_id, inspector, db)
    return list(db.execute(select(AreaPhoto).where(AreaPhoto.inspection_area_id == area_id)).scalars())


@router.post("/observations", response_model=ObservationResponse, status_code=status.HTTP_201_CREATED)
def create_observation(data: ObservationCreate, inspector=Depends(get_current_inspector), db: Session = Depends(get_db)):
    _assert_area_access(data.inspection_area_id, inspector, db)
    if data.observation_type == ObservationType.TEXT and not data.observation_text:
        raise HTTPException(status_code=422, detail="Text observations require observation_text")
    if data.observation_type == ObservationType.VOICE and not data.audio_url:
        raise HTTPException(status_code=422, detail="Voice observations require audio_url")
    observation = AreaObservation(**data.model_dump())
    db.add(observation); db.commit(); db.refresh(observation)
    return observation


@router.get("/areas/{area_id}/observations", response_model=list[ObservationResponse])
def list_observations(area_id: UUID, inspector=Depends(get_current_inspector), db: Session = Depends(get_db)):
    _assert_area_access(area_id, inspector, db)
    return list(db.execute(select(AreaObservation).where(AreaObservation.inspection_area_id == area_id)).scalars())


@router.post("/observations/{observation_id}/transcription", status_code=status.HTTP_201_CREATED)
def save_transcription(observation_id: UUID, data: TranscriptionCreate, inspector=Depends(get_current_inspector), db: Session = Depends(get_db)):
    observation = db.get(AreaObservation, observation_id)
    if not observation:
        raise HTTPException(status_code=404, detail="Observation not found")
    _assert_area_access(observation.inspection_area_id, inspector, db)
    if observation.observation_type != ObservationType.VOICE:
        raise HTTPException(status_code=422, detail="Only voice observations can have a transcription")
    transcription = db.execute(
        select(Transcription).where(Transcription.observation_id == observation_id)
    ).scalar_one_or_none()
    if transcription:
        transcription.transcription_text, transcription.confidence = data.transcription_text, data.confidence
    else:
        transcription = Transcription(observation_id=observation_id, **data.model_dump())
        db.add(transcription)
    db.commit(); db.refresh(transcription)
    return {"id": str(transcription.id), "observation_id": str(observation_id), **data.model_dump()}
