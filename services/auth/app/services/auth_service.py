from uuid import UUID, uuid4
from datetime import datetime, timezone, timedelta
import logging
import os

from fastapi import HTTPException, status, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from shared.db_config import get_db
from shared._user_model import User
from shared._company_model import Company
from shared._inspector_model import Inspector, InspectorType
from shared.password import hash_password
from app.utils.jwt_utils import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
)
from app.utils.cookie_helpers import (
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    set_auth_cookies,
    clear_auth_cookies,
)
from app.api.dtos.auth_dtos import (
    RegisterRequest,
    LoginRequest,
    UserResponse,
    TokenResponse,
    LogoutResponse,
    VerifyEmailResponse,
    ResendVerificationResponse,
)
from app.services.email_service import (
    send_verification_email,
    VERIFICATION_LINK_EXPIRY_HOURS,
)

from fastapi import Request, Response

logger = logging.getLogger(__name__)


def _generate_verification_token(user: User, db: Session) -> str:
    """Create and persist a new email verification token for the user."""
    token = str(uuid4())
    user.email_verification_token = token
    user.email_verification_token_expires_at = datetime.now(timezone.utc) + timedelta(
        hours=VERIFICATION_LINK_EXPIRY_HOURS
    )
    db.commit()
    db.refresh(user)
    return token


def _send_verification_email_safe(user: User) -> None:
    """
    Send verification email, swallowing errors so the API still
    succeeds even if the email provider is temporarily down.
    """
    try:
        send_verification_email(
            to_email=user.email,
            user_name=user.email.split("@")[0],
            token=user.email_verification_token,
        )
    except Exception as exc:
        logger.error("Failed to send verification email to %s: %s", user.email, exc)



def register_user(
    data: RegisterRequest,
    db: Session,
) -> UserResponse:
    """Create a new user account and an individual inspector profile."""
    existing = db.execute(select(User).where(User.email == data.email)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    auto_verify = os.getenv("AUTO_VERIFY_EMAIL", "true").lower() == "true"
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        email_verified=auto_verify,
    )
    db.add(user)
    db.flush()  # get user.id

    # Every registered user must have an inspector profile.
    # If they later create a company, it will be linked then.
    inspector = Inspector(
        user_id=user.id,
        first_name=data.first_name,
        last_name=data.last_name,
        phone_number=data.phone_number,
        license_number=data.license_number,
        inspector_type=InspectorType.INDIVIDUAL,
    )
    db.add(inspector)
    db.commit()
    db.refresh(user)

    if not auto_verify:
        _generate_verification_token(user, db)
        _send_verification_email_safe(user)

    return UserResponse.model_validate(user)


def login_user(
    data: LoginRequest,
    db: Session,
    response: Response,
) -> TokenResponse:
    """Authenticate user, issue JWT cookies, store hashed refresh token in DB."""
    user = db.execute(select(User).where(User.email == data.email)).scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    from shared.password import verify_password

    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox for the verification link.",
        )

    access_token, access_exp = create_access_token(user.id)
    jti = str(uuid4())
    refresh_token, refresh_exp = create_refresh_token(user.id, jti)

    user.refresh_token = hash_password(refresh_token)
    db.commit()

    set_auth_cookies(response, access_token, refresh_token)

    return TokenResponse(
        message="Login successful",
        access_token_expires_at=access_exp,
        refresh_token_expires_at=refresh_exp,
    )



def logout_user(
    user: User,
    db: Session,
    response: Response,
) -> LogoutResponse:
    """Revoke refresh token in DB and clear auth cookies."""
    user.refresh_token = None
    db.commit()
    clear_auth_cookies(response)
    return LogoutResponse(message="Logged out successfully")



def refresh_tokens(
    request: Request,
    response: Response,
    db: Session,
    body_token: str | None = None,
) -> TokenResponse:
    """
    Rotate refresh token: validate old token, issue new pair,
    invalidate old token in DB, set new cookies.
    """
    from shared.password import verify_password as pw_verify

    # Prefer cookie, fall back to body
    refresh_token = request.cookies.get(REFRESH_COOKIE) or body_token
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not provided",
        )

    try:
        payload = decode_refresh_token(refresh_token)
    except Exception:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id = payload.get("sub")
    user = db.get(User, user_id)
    if not user or not user.refresh_token:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if not pw_verify(refresh_token, user.refresh_token):
        user.refresh_token = None
        db.commit()
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token reuse detected – all sessions revoked",
        )

    if not user.is_active:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    new_access_token, access_exp = create_access_token(user.id)
    new_jti = str(uuid4())
    new_refresh_token, refresh_exp = create_refresh_token(user.id, new_jti)

    user.refresh_token = hash_password(new_refresh_token)
    db.commit()

    set_auth_cookies(response, new_access_token, new_refresh_token)

    return TokenResponse(
        message="Tokens refreshed",
        access_token_expires_at=access_exp,
        refresh_token_expires_at=refresh_exp,
    )



def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency: extract and validate the logged-in user from cookie."""
    token = request.cookies.get(ACCESS_COOKIE)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    return user


def get_current_inspector(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Inspector:
    """FastAPI dependency: get the Inspector profile for the logged-in user."""
    inspector = db.execute(
        select(Inspector).where(Inspector.user_id == current_user.id)
    ).scalar_one_or_none()
    if not inspector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspector profile not found",
        )
    return inspector


def require_company_owner(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> tuple[User, Company]:
    """
    FastAPI dependency: ensure the logged-in user is the owner of a company.
    Returns (user, company) tuple.
    """
    inspector = db.execute(
        select(Inspector).where(Inspector.user_id == current_user.id)
    ).scalar_one_or_none()
    if not inspector or not inspector.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a company member",
        )

    company = db.get(Company, inspector.company_id)
    if not company or company.owner_id != inspector.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the company owner can perform this action",
        )

    return current_user, company


def verify_email(
    token: str,
    db: Session,
) -> VerifyEmailResponse:
    """
    Verify a user's email using the token sent to their inbox.
    Marks the user as verified and clears the token.
    """
    user = db.execute(
        select(User).where(User.email_verification_token == token)
    ).scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    if user.email_verification_token_expires_at and user.email_verification_token_expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired. Please request a new one.",
        )

    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_token_expires_at = None
    db.commit()

    return VerifyEmailResponse(
        message="Email verified successfully. You can now log in.",
        email=user.email,
    )


def resend_verification(
    data: LoginRequest,
    db: Session,
) -> ResendVerificationResponse:
    """
    Resend the verification email. Accepts email + password to confirm
    the requester owns the account.
    """
    from shared.password import verify_password

    user = db.execute(select(User).where(User.email == data.email)).scalar_one_or_none()

    # Generic response to prevent email enumeration
    generic_response = ResendVerificationResponse(
        message="If the account exists and is unverified, a verification email has been sent.",
    )

    if not user:
        return generic_response

    if not verify_password(data.password, user.hashed_password):
        return generic_response

    if user.email_verified:
        return generic_response

    _generate_verification_token(user, db)
    _send_verification_email_safe(user)

    return generic_response
