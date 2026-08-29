"""core-service — FastAPI entrypoint.

Exposes: /api/v1/clients, /api/v1/properties, /api/v1/inspections,
         /api/v1/dashboard
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="DefectLoupe — core-service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"service": "core-service", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}

# Route mounting (Day 2):
#   from app.api.routes.client_routes import router as client_router
#   from app.api.routes.property_routes import router as property_router
#   from app.api.routes.inspection_routes import router as inspection_router
#   from app.api.routes.area_routes import router as area_router
#   from app.api.routes.dashboard_routes import router as dashboard_router
#   app.include_router(client_router)
#   ...
