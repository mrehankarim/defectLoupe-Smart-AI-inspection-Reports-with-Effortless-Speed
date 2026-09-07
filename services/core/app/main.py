"""core-service — FastAPI entrypoint.

Exposes: /api/v1/clients, /api/v1/properties, /api/v1/inspections,
         /api/v1/dashboard
"""
import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from shared.base import Base
from shared.db_config import engine

# Import shared models so their tables exist for FK constraints
from shared._user_model import User  # noqa: F401
from shared._inspector_model import Inspector  # noqa: F401
from shared._company_model import Company  # noqa: F401

# Import all core models so Base.metadata knows about them before create_all
from app.repository import client as _client_model  # noqa: F401
from app.repository import property as _property_model  # noqa: F401
from app.repository import inspection as _inspection_model  # noqa: F401
from app.repository import inspection_area as _area_model  # noqa: F401
from app.repository import area_template as _template_model  # noqa: F401

# Create all tables on startup (hackathon mode — skip Alembic)
try:
    Base.metadata.create_all(bind=engine)
except Exception as exc:
    import warnings
    warnings.warn(f"Could not create tables (DB may be unreachable): {exc}")

tags_metadata = [
    {"name": "clients", "description": "Client CRUD — manage property-inspection clients."},
    {"name": "properties", "description": "Property CRUD — real-estate assets linked to clients."},
    {"name": "inspections", "description": "Inspection lifecycle — create, schedule, run, complete, export."},
    {"name": "areas", "description": "Inspection areas — rooms/zones with reorder and built-in templates."},
    {"name": "templates", "description": "Custom area templates — user-defined reusable area sets."},
    {"name": "dashboard", "description": "Dashboard statistics — tenant-scoped counts and summaries."},
    {"name": "system", "description": "Health check and demo seed."},
]

app = FastAPI(
    title="DefectLoupe — core-service",
    version="0.1.0",
    description=(
        "Core business service for the DefectLoupe property-inspection platform.\n\n"
        "Manages clients, properties, inspections (lifecycle with state machine), "
        "inspection areas (built-in + custom templates), and dashboard statistics.\n\n"
        "All endpoints require a valid JWT cookie (`access_token`) and are scoped "
        "to the authenticated inspector's tenant (solo or company)."
    ),
    contact={"name": "DefectLoupe Team", "url": "https://github.com/umermujahid/DefectLoupe"},
    license_info={"name": "MIT"},
    openapi_tags=tags_metadata,
)

import os

cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost,http://localhost:5173,http://localhost:3000")
cors_origins = [o.strip() for o in cors_origins_raw.split(",")] if cors_origins_raw != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.onrender\.com|http://localhost.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request logging middleware ──────────────────────────────────────────────
logger = logging.getLogger("core-service")
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
from app.api.routes.client_routes import router as client_router
from app.api.routes.property_routes import router as property_router
from app.api.routes.inspection_routes import router as inspection_router
from app.api.routes.area_routes import router as area_router
from app.api.routes.dashboard_routes import router as dashboard_router
from app.api.routes.template_routes import router as template_router

app.include_router(client_router)
app.include_router(property_router)
app.include_router(inspection_router)
app.include_router(area_router)
app.include_router(dashboard_router)
app.include_router(template_router)


@app.get("/", tags=["system"])
def root():
    """Service identity ping."""
    return {"service": "core-service", "status": "ok"}


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
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "unavailable",
    }


@app.post("/api/v1/demo/seed", tags=["system"])
def seed_demo():
    """Seed the database with demo data for the hackathon."""
    from app.seed_demo import seed_demo_data
    seed_demo_data()
    return {"message": "Demo data seeded"}
