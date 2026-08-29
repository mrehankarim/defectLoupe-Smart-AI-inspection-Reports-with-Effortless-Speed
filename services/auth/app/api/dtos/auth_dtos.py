from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field



from app.api.dtos.inspector_dtos import InspectorResponse


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)
    phone_number: str | None = None
    license_number: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class RefreshTokenRequest(BaseModel):
    refresh_token: str | None = None



class UserResponse(BaseModel):
    id: UUID
    email: str
    is_active: bool
    email_verified: bool
    created_at: datetime
    inspector: InspectorResponse | None = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    message: str
    access_token_expires_at: datetime
    refresh_token_expires_at: datetime


class LogoutResponse(BaseModel):
    message: str


class VerifyEmailResponse(BaseModel):
    message: str
    email: str


class ResendVerificationResponse(BaseModel):
    message: str
