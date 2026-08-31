"""API routes for photo management."""
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from shared.db_config import get_db
from shared.auth_deps import get_current_inspector
from app.api.dtos.photo_dto import PhotoResponse, UploadPhotoResponse
from app.services import photo_service

router = APIRouter(tags=["photos"])


@router.post(
    "/api/v1/areas/{area_id}/photos",
    response_model=UploadPhotoResponse,
    status_code=201,
    summary="Upload a photo to an area",
)
async def upload_photo(
    area_id: UUID,
    file: UploadFile = File(...),
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Upload an image (multipart) to Cloudinary and link it to an inspection area."""
    return await photo_service.upload_and_create_photo(area_id, file, db)


@router.get(
    "/api/v1/areas/{area_id}/photos",
    response_model=list[PhotoResponse],
    summary="List photos for an area",
)
def list_photos(
    area_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Return all photos for a given inspection area, newest first."""
    return photo_service.list_photos_for_area(area_id, db)


@router.delete(
    "/api/v1/photos/{photo_id}",
    summary="Delete a photo",
)
def delete_photo(
    photo_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Delete a photo from storage and remove its database row."""
    return photo_service.delete_photo(photo_id, db)


@router.get(
    "/api/v1/photos/{photo_id}/download",
    summary="Download / redirect to photo",
)
def download_photo(
    photo_id: UUID,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Redirect to the Cloudinary URL (or serve local file in dev)."""
    photo = photo_service.get_photo(photo_id, db)
    return RedirectResponse(url=photo.photo_url)
