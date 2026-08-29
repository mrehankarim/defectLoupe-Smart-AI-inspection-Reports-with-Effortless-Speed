from datetime import datetime, timezone, timedelta
from uuid import UUID

import jwt

from app.utils.config_loader import (
    get_access_token_secret,
    get_refresh_token_secret,
    get_access_token_expiry_seconds,
    get_refresh_token_expiry_seconds,
)


def create_access_token(user_id: UUID) -> tuple[str, datetime]:
    """Create a JWT access token. Returns (token_string, expiry_datetime)."""
    expires_at = datetime.now(timezone.utc) + timedelta(
        seconds=get_access_token_expiry_seconds()
    )
    payload = {
        "sub": str(user_id),
        "exp": expires_at,
        "type": "access",
    }
    token = jwt.encode(payload, get_access_token_secret(), algorithm="HS256")
    return token, expires_at


def create_refresh_token(user_id: UUID, jti: str) -> tuple[str, datetime]:
    """Create a JWT refresh token with a unique jti for rotation tracking."""
    expires_at = datetime.now(timezone.utc) + timedelta(
        seconds=get_refresh_token_expiry_seconds()
    )
    payload = {
        "sub": str(user_id),
        "exp": expires_at,
        "type": "refresh",
        "jti": jti,
    }
    token = jwt.encode(payload, get_refresh_token_secret(), algorithm="HS256")
    return token, expires_at


def decode_access_token(token: str) -> dict:
    """Decode and validate an access token."""
    return jwt.decode(token, get_access_token_secret(), algorithms=["HS256"])


def decode_refresh_token(token: str) -> dict:
    """Decode and validate a refresh token."""
    return jwt.decode(token, get_refresh_token_secret(), algorithms=["HS256"])
