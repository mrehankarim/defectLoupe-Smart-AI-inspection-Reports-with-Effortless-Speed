"""media-service — FastAPI entrypoint.

Exposes: /api/v1/photos, /api/v1/observations, /api/v1/transcriptions,
         /api/v1/areas/{id}/photos, /api/v1/areas/{id}/observations,
         /api/v1/inspections/{id}/media
"""
import os
import warnings
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

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

app = FastAPI(title="DefectLoupe — media-service", version="0.1.0")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    clean_errors = []
    for err in exc.errors():
        clean_err = {}
        for k, v in err.items():
            if isinstance(v, bytes):
                clean_err[k] = f"<binary data: {len(v)} bytes>"
            elif isinstance(v, (list, tuple)):
                clean_err[k] = [
                    f"<binary data: {len(item)} bytes>" if isinstance(item, bytes) else item
                    for item in v
                ]
            elif isinstance(v, dict):
                clean_err[k] = {
                    dk: (f"<binary data: {len(dv)} bytes>" if isinstance(dv, bytes) else dv)
                    for dk, dv in v.items()
                }
            else:
                clean_err[k] = v
        clean_errors.append(clean_err)
    return JSONResponse(status_code=422, content={"detail": clean_errors})

try:
    Base.metadata.create_all(bind=engine)
except Exception as exc:
    warnings.warn(f"Could not create tables (DB may be unreachable): {exc}")

_cors_raw = os.getenv("CORS_ORIGINS", "http://localhost,http://localhost:5173,http://localhost:80")
_cors = [o.strip() for o in _cors_raw.split(",")] if _cors_raw != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors,
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


from app.api.routes.photo_routes import router as photo_router
from app.api.routes.observation_routes import router as observation_router
from app.api.routes.transcription_routes import router as transcription_router
from app.api.routes.media_routes import router as media_router
from fastapi.staticfiles import StaticFiles
from app.utils.config import LOCAL_UPLOAD_DIR

app.include_router(photo_router)
app.include_router(observation_router)
app.include_router(transcription_router)
app.include_router(media_router)

app.mount("/api/v1/media/files", StaticFiles(directory=str(LOCAL_UPLOAD_DIR)), name="media_files")
