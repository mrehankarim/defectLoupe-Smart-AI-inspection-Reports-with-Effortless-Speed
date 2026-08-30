"""Pydantic DTOs for the Client resource."""
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CreateClientRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone_number: str | None = None


class UpdateClientRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone_number: str | None = None


class ClientResponse(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: str
    phone_number: str | None = None
    inspector_id: UUID | None = None
    company_id: UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClientListResponse(BaseModel):
    items: list[ClientResponse]
    total: int
