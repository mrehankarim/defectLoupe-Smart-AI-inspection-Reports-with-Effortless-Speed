"""auth-service — FastAPI entrypoint.

Exposes: /auth/*, /inspectors/*, /api/v1/auth/*
Mounts existing auth routes from the legacy monolith.

During Day 1 of the hackathon the imports will be refactored to use the
`shared` package (shared.db_config, shared.base, shared.auth_deps).
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="DefectLoupe — auth-service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for prod
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

# Route mounting happens after Day 1 refactor:
#   from app.api.routes.auth_routes import router as auth_router
#   from app.api.routes.inspector_routes import router as inspector_router
#   app.include_router(auth_router)
#   app.include_router(inspector_router)
