"""ai-service — FastAPI entrypoint.

Exposes: /api/v1/rag/*, /api/v1/photos/{id}/analyze,
         /api/v1/inspections/{id}/generate-report,
         /api/v1/inspections/{id}/report/*,
         /api/v1/reports/{token}/verify (public)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="DefectLoupe — ai-service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# Route mounting (Day 2):
#   from app.api.routes.rag_routes import router as rag_router
#   from app.api.routes.vision_routes import router as vision_router
#   from app.api.routes.report_routes import router as report_router
#   app.include_router(rag_router)
#   ...
