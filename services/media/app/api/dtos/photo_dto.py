"""Pydantic DTOs for photo resources."""
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PhotoResponse(BaseModel):
    id: UUID
    inspection_area_id: UUID
    photo_url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PhotoListResponse(BaseModel):
    """Wrapper for a list of photos belonging to an area."""
    photos: list[PhotoResponse]


class UploadPhotoResponse(BaseModel):
    """Returned immediately after a successful upload."""
    id: UUID
    photo_url: str
    message: str = "Photo uploaded successfully"
