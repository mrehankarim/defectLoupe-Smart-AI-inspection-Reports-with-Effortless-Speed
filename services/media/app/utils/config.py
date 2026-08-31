"""media-service configuration loader.

Reads environment variables and exposes them as module-level constants.
Cloudinary is configured eagerly so the SDK is ready at import time.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from services/media/app/.env
_ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=_ENV_PATH)

# ── Cloudinary ────────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
CLOUDINARY_URL: str = os.getenv("CLOUDINARY_URL", "")

# Configure the Cloudinary SDK globally
import cloudinary

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True,
)

# ── Redis / Celery ───────────────────────────────────────────────────────
REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# ── Whisper ───────────────────────────────────────────────────────────────
WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "small")

# ── Upload folder (local fallback when Cloudinary is not configured) ─────
LOCAL_UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
LOCAL_UPLOAD_DIR.mkdir(exist_ok=True)


def is_cloudinary_configured() -> bool:
    """Return True when Cloudinary credentials are present."""
    return bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET)
