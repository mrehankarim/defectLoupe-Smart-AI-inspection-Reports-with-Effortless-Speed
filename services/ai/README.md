# ai-service

RAG (pgvector), Gemini vision, report synthesis, PDF generation, QR verification.

## Scope

- **Tables owned:** `document_chunks`, `report_jobs`
- **Routes:** `/api/v1/rag/documents/upload`, `/api/v1/rag/search`,
  `/api/v1/photos/{id}/analyze`, `/api/v1/inspections/{id}/generate-report`,
  `/api/v1/inspections/{id}/report/pdf`, `/api/v1/inspections/{id}/report/status`,
  `/api/v1/reports/{token}/verify`
- **Owner:** M4 (Mobile + AI Lead)

## Run locally

```bash
cd services/ai
cp app/.env.example app/.env     # fill Gemini key
uvicorn app.main:app --reload --port 8004

# Celery worker for vision + reports
celery -A app.workers.celery_app worker -l info -Q vision,reports
```

## Docker build

```bash
docker build --build-arg SERVICE_NAME=ai -f services/ai/Dockerfile -t defectloupe-ai .
```

## Dependencies on other services

- Decodes JWT locally via `shared/auth_deps.py`.
- **Integration day** (Day 3): calls `core-service` at `$CORE_SERVICE_URL` for inspection full-context, and `media-service` at `$MEDIA_SERVICE_URL` for photos + transcriptions. Until then, uses fixture data.
