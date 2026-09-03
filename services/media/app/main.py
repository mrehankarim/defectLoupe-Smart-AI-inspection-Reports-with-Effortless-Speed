"""media-service — FastAPI entrypoint.

Exposes: /api/v1/photos, /api/v1/observations, /api/v1/transcriptions,
         /api/v1/areas/{id}/photos, /api/v1/areas/{id}/observations,
         /api/v1/inspections/{id}/media
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from shared.base import Base
from shared.db_config import engine
from shared._user_model import User  # noqa: F401
from shared._inspector_model import Inspector  # noqa: F401
from shared._company_model import Company  # noqa: F401
from app.repository.external_models import InspectionArea  # noqa: F401
from app.repository.area_photo import AreaPhoto  # noqa: F401
from app.repository.area_observation import AreaObservation  # noqa: F401
from app.repository.transcription import Transcription  # noqa: F401

app = FastAPI(title="DefectLoupe — media-service", version="0.1.0")
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"service": "media-service", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}

from app.api.routes.media_routes import router as media_router
app.include_router(media_router)
