"""ai-service — FastAPI entrypoint.

Exposes: /api/v1/rag/*, /api/v1/photos/{id}/analyze,
         /api/v1/inspections/{id}/generate-report,
         /api/v1/inspections/{id}/report/*,
         /api/v1/reports/{token}/verify (public)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.report_routes import router as report_router

app = FastAPI(title="DefectLoupe — ai-service", version="0.1.0")

import os as _os
_cors_raw = _os.getenv("CORS_ORIGINS", "http://localhost,http://localhost:5173,http://localhost:80")
_cors = [o.strip() for o in _cors_raw.split(",")] if _cors_raw != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(report_router)


@app.get("/")
def root():
    return {"service": "ai-service", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}
