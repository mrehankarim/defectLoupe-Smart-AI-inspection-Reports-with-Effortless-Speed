"""media-service — FastAPI entrypoint.

Exposes: /api/v1/photos, /api/v1/observations, /api/v1/transcriptions,
         /api/v1/areas/{id}/photos, /api/v1/areas/{id}/observations,
         /api/v1/inspections/{id}/media
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="DefectLoupe — media-service", version="0.1.0")

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

# Route mounting (Day 2):
#   from app.api.routes.photo_routes import router as photo_router
#   from app.api.routes.observation_routes import router as observation_router
#   from app.api.routes.transcription_routes import router as transcription_router
#   app.include_router(photo_router)
#   ...
