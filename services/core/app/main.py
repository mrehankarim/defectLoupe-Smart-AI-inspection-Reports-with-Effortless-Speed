"""core-service — FastAPI entrypoint.

Exposes: /api/v1/clients, /api/v1/properties, /api/v1/inspections,
         /api/v1/dashboard
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from shared.base import Base
from shared.db_config import engine

# Import all models so Base.metadata knows about them before create_all
from app.repository import client as _client_model  # noqa: F401
from app.repository import property as _property_model  # noqa: F401
from app.repository import inspection as _inspection_model  # noqa: F401
from app.repository import inspection_area as _area_model  # noqa: F401

# Create all tables on startup (hackathon mode — skip Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DefectLoupe — core-service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount routes ──────────────────────────────────────────────────────────
from app.api.routes.client_routes import router as client_router
from app.api.routes.property_routes import router as property_router
from app.api.routes.inspection_routes import router as inspection_router
from app.api.routes.area_routes import router as area_router
from app.api.routes.dashboard_routes import router as dashboard_router

app.include_router(client_router)
app.include_router(property_router)
app.include_router(inspection_router)
app.include_router(area_router)
app.include_router(dashboard_router)


@app.get("/")
def root():
    return {"service": "core-service", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}
