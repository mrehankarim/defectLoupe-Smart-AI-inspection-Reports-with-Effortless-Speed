"""ai-service — FastAPI entrypoint.

Exposes: /api/v1/rag/*, /api/v1/photos/{id}/analyze,
         /api/v1/inspections/{id}/generate-report,
         /api/v1/inspections/{id}/report/*,
         /api/v1/reports/{token}/verify (public)
"""
import logging
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env BEFORE any shared imports
load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from shared.base import Base
from shared.db_config import engine

# Import shared models so FK targets exist in metadata
from shared._company_model import Company  # noqa: F401
from shared._inspector_model import Inspector  # noqa: F401
from shared._user_model import User  # noqa: F401

# Import all models so Base.metadata knows about them before create_all
from app.repository import document_chunk as _doc_chunk_model  # noqa: F401
from app.repository import report_job as _report_job_model  # noqa: F401
from app.repository import photo_analysis as _photo_analysis_model  # noqa: F401

# Enable pgvector extension and create all tables on startup (hackathon mode — skip Alembic)
try:
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()
    Base.metadata.create_all(bind=engine)
except Exception as exc:
    import warnings
    warnings.warn(f"Could not create tables (DB may be unreachable): {exc}")

logger = logging.getLogger("ai-service")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(title="DefectLoupe — ai-service", version="0.1.0")

_cors_raw = os.getenv("CORS_ORIGINS", "http://localhost,http://localhost:5173,http://localhost:3000")
_cors = [o.strip() for o in _cors_raw.split(",")] if _cors_raw != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors,
    allow_origin_regex=r"https://.*\.onrender\.com|http://localhost.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"service": "ai-service", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}


# Route mounting
from app.api.routes.rag_routes import router as rag_router
from app.api.routes.vision_routes import router as vision_router
from app.api.routes.report_routes import router as report_router
from app.api.routes.verify_routes import router as verify_router

app.include_router(rag_router)
app.include_router(vision_router)
app.include_router(report_router)
app.include_router(verify_router)
