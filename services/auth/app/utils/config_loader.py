import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[2] / "app" / ".env"
load_dotenv(dotenv_path=ENV_PATH)


def _parse_expiry_to_seconds(expiry_str: str) -> int:
    """Parse expiry strings like '15m', '10d', '1h', '3600s' into seconds."""
    unit = expiry_str[-1]
    value = int(expiry_str[:-1])
    if unit == "m":
        return value * 60
    elif unit == "h":
        return value * 3600
    elif unit == "d":
        return value * 86400
    elif unit == "s":
        return value
    raise ValueError(f"Unknown expiry unit: {unit}")


def get_access_token_secret() -> str:
    secret = os.getenv("ACCESS_TOKEN_SECRET")
    if not secret:
        raise RuntimeError("ACCESS_TOKEN_SECRET is not set")
    return secret


def get_refresh_token_secret() -> str:
    secret = os.getenv("REFRESH_TOKEN_SECRET")
    if not secret:
        raise RuntimeError("REFRESH_TOKEN_SECRET is not set")
    return secret


def get_access_token_expiry_seconds() -> int:
    return _parse_expiry_to_seconds(os.getenv("ACCESS_TOKEN_EXPIRY", "15m"))


def get_refresh_token_expiry_seconds() -> int:
    return _parse_expiry_to_seconds(os.getenv("REFRESH_TOKEN_EXPIRY", "10d"))


def get_resend_api_key() -> str:
    key = os.getenv("RESEND_EMAIL_VERIFICATION_KEY")
    if not key:
        raise RuntimeError("RESEND_EMAIL_VERIFICATION_KEY is not set")
    return key


def get_app_base_url() -> str:
    return os.getenv("APP_BASE_URL", "http://localhost:8000")


def get_email_from_address() -> str:
    return os.getenv("EMAIL_FROM_ADDRESS", "DefectLoupe <onboarding@resend.dev>")
