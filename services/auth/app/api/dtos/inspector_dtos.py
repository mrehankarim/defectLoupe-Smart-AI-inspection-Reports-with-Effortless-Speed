from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class CreateCompanyRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    phone_number: str | None = None
    website: str | None = None
    address: str = Field(min_length=1)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    zip_code: str = Field(min_length=1, max_length=20)
    country: str = Field(min_length=1, max_length=100, default="US")


class CompanyResponse(BaseModel):
    id: UUID
    name: str
    email: str
    phone_number: str | None
    website: str | None
    address: str
    city: str
    state: str
    zip_code: str
    country: str
    owner_id: UUID | None
    created_at: datetime
    model_config = {"from_attributes": True}



class AddInspectorRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)
    phone_number: str | None = None
    license_number: str | None = None


class InspectorResponse(BaseModel):
    id: UUID
    user_id: UUID
    company_id: UUID | None
    first_name: str
    last_name: str
    phone_number: str | None
    license_number: str | None
    inspector_type: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileResponse(BaseModel):
    user_id: UUID
    email: str
    inspector: InspectorResponse | None = None
    is_company_owner: bool = False
