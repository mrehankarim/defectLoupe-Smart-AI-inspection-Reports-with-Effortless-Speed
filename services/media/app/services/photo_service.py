"""Business logic for photo management."""
import logging
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repository.area_photo import AreaPhoto
from app.api.dtos.photo_dto import PhotoResponse, UploadPhotoResponse
from app.utils.storage import upload_photo, delete_file

logger = logging.getLogger(__name__)


async def upload_and_create_photo(
    area_id: UUID,
    file: UploadFile,
    db: Session,
) -> UploadPhotoResponse:
    """Upload a photo to Cloudinary and persist an AreaPhoto row.

    The area_id is accepted as a UUID path param — no cross-service call
    to core-service is needed (independence contract).
    """
    # Upload to storage first
    photo_url = await upload_photo(file)

    photo = AreaPhoto(
        inspection_area_id=area_id,
        photo_url=photo_url,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    logger.info("Created photo %s for area %s", photo.id, area_id)
    return UploadPhotoResponse(id=photo.id, photo_url=photo_url)


def list_photos_for_area(
    area_id: UUID,
    db: Session,
) -> list[PhotoResponse]:
    """Return all photos for a given inspection area, newest first."""
    rows = db.execute(
        select(AreaPhoto)
        .where(AreaPhoto.inspection_area_id == area_id)
        .order_by(AreaPhoto.created_at.desc())
    ).scalars().all()

    return [PhotoResponse.model_validate(r) for r in rows]


def delete_photo(
    photo_id: UUID,
    db: Session,
) -> dict:
    """Delete a photo from storage and remove the database row."""
    photo = db.get(AreaPhoto, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found",
        )

    # Delete from storage backend
    delete_file(photo.photo_url)

    db.delete(photo)
    db.commit()
    logger.info("Deleted photo %s", photo_id)
    return {"message": "Photo deleted successfully"}


def get_photo(
    photo_id: UUID,
    db: Session,
) -> AreaPhoto:
    """Fetch a single photo by ID. Raises 404 if not found."""
    photo = db.get(AreaPhoto, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found",
        )
    return photo
