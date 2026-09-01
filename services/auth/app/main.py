"""auth-service — FastAPI entrypoint."""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from app.utils.config_loader import get_cors_origins
from app.utils.rate_limit import limiter
from shared.db_config import engine

app = FastAPI(title="DefectLoupe — auth-service", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"service": "auth-service", "status": "ok"}


@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        ) from exc
    return {"status": "ok", "database": "connected"}


from app.api.routes.auth_routes import router as auth_router
from app.api.routes.inspector_routes import router as inspector_router

app.include_router(auth_router, prefix="/api/v1")
app.include_router(inspector_router, prefix="/api/v1")
app.include_router(auth_router, include_in_schema=False)
app.include_router(inspector_router, include_in_schema=False)
