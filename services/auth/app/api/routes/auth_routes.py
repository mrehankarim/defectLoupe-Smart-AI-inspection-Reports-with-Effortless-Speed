from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from shared.db_config import get_db
from app.api.dtos.auth_dtos import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    UserResponse,
    TokenResponse,
    LogoutResponse,
    VerifyEmailResponse,
    ResendVerificationResponse,
)
from app.services.auth_service import (
    register_user,
    login_user,
    logout_user,
    refresh_tokens,
    get_current_user,
    verify_email,
    resend_verification,
)
from shared._user_model import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Create a new user account."""
    return register_user(data, db)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Authenticate and receive access + refresh tokens via secure cookies."""
    return login_user(data, db, response)


@router.post("/logout", response_model=LogoutResponse)
def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke tokens and clear cookies."""
    return logout_user(current_user, db, response)


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    request: Request,
    response: Response,
    body: RefreshTokenRequest | None = None,
    db: Session = Depends(get_db),
):
    """
    Rotate refresh token and receive a new access + refresh token pair.
    The old refresh token is invalidated; the new one is set as a cookie.
    """
    return refresh_tokens(request, response, db, body.refresh_token if body else None)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently logged-in user's info."""
    return UserResponse.model_validate(current_user)


@router.get("/verify-email", response_model=VerifyEmailResponse)
def verify_email_endpoint(
    token: str,
    db: Session = Depends(get_db),
):
    """Verify a user's email via the token link sent to their inbox."""
    return verify_email(token, db)


@router.post("/resend-verification", response_model=ResendVerificationResponse)
def resend_verification_endpoint(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Resend the email verification link.
    Requires email + password to prove account ownership.
    """
    return resend_verification(data, db)
