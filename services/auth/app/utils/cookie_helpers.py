from fastapi import Response

from app.utils.config_loader import (
    get_access_token_expiry_seconds,
    get_refresh_token_expiry_seconds,
)

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
) -> None:
    """Set both access and refresh tokens as HTTP-only secure cookies."""
    response.set_cookie(
        key=ACCESS_COOKIE,
        value=access_token,
        max_age=get_access_token_expiry_seconds(),
        httponly=True,
        # Local development is served over HTTP.  Set COOKIE_SECURE=true in
        # production to require HTTPS without breaking the browser login flow.
        secure=__import__('os').getenv("COOKIE_SECURE", "false").lower() == "true",
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        max_age=get_refresh_token_expiry_seconds(),
        httponly=True,
        secure=__import__('os').getenv("COOKIE_SECURE", "false").lower() == "true",
        samesite="lax",
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    """Delete both auth cookies."""
    secure = __import__('os').getenv("COOKIE_SECURE", "false").lower() == "true"
    response.delete_cookie(key=ACCESS_COOKIE, httponly=True, secure=secure, samesite="lax", path="/")
    response.delete_cookie(key=REFRESH_COOKIE, httponly=True, secure=secure, samesite="lax", path="/")
