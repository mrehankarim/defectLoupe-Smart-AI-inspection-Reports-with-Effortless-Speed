"""Vision AI Analysis routes.

Exposes endpoints under /api/v1/photos for Gemini-powered defect
detection on inspection photos.  Route paths match Traefik Gateway rules.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session

from shared.db_config import get_db
from shared.auth_deps import get_current_inspector
from app.api.dtos.vision_dto import AnalysisResponse
from app.services import vision_service

router = APIRouter(prefix="/api/v1", tags=["Vision AI Analysis"])


@router.post(
    "/photos/{photo_id}/analyze",
    response_model=AnalysisResponse,
    status_code=201,
    summary="Analyse an inspection photo for defects using Gemini Vision",
)
async def analyze_photo(
    photo_id: UUID,
    file: UploadFile = File(None),
    mime_type: str = Query("image/jpeg", description="MIME type of the uploaded image"),
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Accept an image file and analyse it for property defects.

    If an analysis already exists for this photo_id it is returned
    directly (cache hit) without calling Gemini again.
    """
    if file is None:
        raise HTTPException(
            status_code=400,
            detail="An image file must be uploaded.",
        )

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    record = vision_service.analyze_photo(
        photo_id=photo_id,
        image_bytes=image_bytes,
        mime_type=mime_type,
        db=db,
    )
    return AnalysisResponse.model_validate(record)


@router.get(
    "/photos/{photo_id}/analysis",
    response_model=AnalysisResponse | None,
    summary="Retrieve stored analysis for a photo",
)
def get_photo_analysis(
    photo_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Return the cached defect analysis for a photo, or 404."""
    record = vision_service.get_analysis(photo_id=photo_id, db=db)
    if record is None:
        raise HTTPException(
            status_code=404,
            detail=f"No analysis found for photo_id '{photo_id}'.",
        )
    return AnalysisResponse.model_validate(record)
