"""media-service — FastAPI entrypoint.

Exposes: /api/v1/photos, /api/v1/observations, /api/v1/transcriptions,
         /api/v1/areas/{id}/photos, /api/v1/areas/{id}/observations,
         /api/v1/inspections/{id}/media
"""
import logging
import os
import time

# Load .env BEFORE any shared imports (shared/db_config.py reads DATABASE_URL at import time)
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from shared.base import Base
from shared.db_config import engine

# Import all models so Base.metadata knows about them before create_all
from app.repository import inspection_area_stub as _area_stub  # noqa: F401
from app.repository import area_photo as _photo_model  # noqa: F401
from app.repository import area_observation as _obs_model  # noqa: F401
from app.repository import transcription as _txn_model  # noqa: F401

# Create all tables on startup (hackathon mode — skip Alembic)
try:
    Base.metadata.create_all(bind=engine)
except Exception as exc:
    import warnings
    warnings.warn(f"Could not create tables (DB may be unreachable): {exc}")

tags_metadata = [
    {"name": "photos", "description": "Photo upload, listing, and deletion."},
    {"name": "observations", "description": "Text and voice observations."},
    {"name": "transcriptions", "description": "Speech-to-text transcription pipeline."},
    {"name": "system", "description": "Health check and service info."},
]

app = FastAPI(
    title="DefectLoupe — media-service",
    version="0.1.0",
    description=(
        "Media service for the DefectLoupe property-inspection platform.\n\n"
        "Manages photo uploads (Cloudinary), text/voice observations, "
        "and automated speech-to-text transcription via faster-whisper.\n\n"
        "All endpoints require a valid JWT cookie (`access_token`)."
    ),
    openapi_tags=tags_metadata,
)

cors_origins_raw = os.getenv("CORS_ORIGINS", "*")
cors_origins = [o.strip() for o in cors_origins_raw.split(",")] if cors_origins_raw != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request logging middleware ──────────────────────────────────────────────
logger = logging.getLogger("media-service")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start) * 1000
    logger.info(
        "%s %s %d %.1fms",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


# ── Mount routes ──────────────────────────────────────────────────────────
from app.api.routes.photo_routes import router as photo_router
from app.api.routes.observation_routes import router as observation_router
from app.api.routes.transcription_routes import router as transcription_router

app.include_router(photo_router)
app.include_router(observation_router)
app.include_router(transcription_router)


@app.get("/", tags=["system"])
def root():
    """Service identity ping."""
    return {"service": "media-service", "status": "ok"}


@app.get("/health", tags=["system"])
def health():
    """Health check with dependency status."""
    from sqlalchemy import text

    db_ok = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass

    from app.utils.config import is_cloudinary_configured
    cloudinary_ok = is_cloudinary_configured()

    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "unavailable",
        "cloudinary": "configured" if cloudinary_ok else "not configured (local fallback)",
    }
