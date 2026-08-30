"""Pydantic DTOs for the Property resource."""
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.repository.property import PropertyType


class CreatePropertyRequest(BaseModel):
    client_id: UUID
    address: str = Field(min_length=1)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    zip_code: str = Field(min_length=1, max_length=20)
    country: str = Field(min_length=1, max_length=100, default="US")
    property_type: PropertyType = PropertyType.RESIDENTIAL
    year_built: int | None = None
    square_footage: int | None = None


class UpdatePropertyRequest(BaseModel):
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    country: str | None = None
    property_type: PropertyType | None = None
    year_built: int | None = None
    square_footage: int | None = None


class PropertyResponse(BaseModel):
    id: UUID
    client_id: UUID
    address: str
    city: str
    state: str
    zip_code: str
    country: str
    property_type: PropertyType
    year_built: int | None = None
    square_footage: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PropertyListResponse(BaseModel):
    items: list[PropertyResponse]
    total: int
