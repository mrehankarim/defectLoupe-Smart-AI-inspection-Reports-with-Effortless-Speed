"""auth-service — FastAPI entrypoint.

Exposes: /auth/*, /inspectors/*, /api/v1/auth/*
Mounts existing auth routes from the legacy monolith.

During Day 1 of the hackathon the imports will be refactored to use the
`shared` package (shared.db_config, shared.base, shared.auth_deps).
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from shared.base import Base
from shared.db_config import engine

# Register the canonical auth models before creating tables.  They share the
# same metadata registry as core/media, so foreign keys work across services.
from shared._user_model import User  # noqa: F401
from shared._inspector_model import Inspector  # noqa: F401
from shared._company_model import Company  # noqa: F401

app = FastAPI(title="DefectLoupe — auth-service", version="0.1.0")
try:
    Base.metadata.create_all(bind=engine)
except Exception as exc:
    import warnings
    warnings.warn(f"Could not create tables (DB may be unreachable): {exc}")

import os as _os
_cors_raw = _os.getenv("CORS_ORIGINS", "http://localhost,http://localhost:5173,http://localhost:3000")
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
    return {"service": "auth-service", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}

from app.api.routes.auth_routes import router as auth_router
from app.api.routes.inspector_routes import router as inspector_router
app.include_router(auth_router)
app.include_router(inspector_router)
