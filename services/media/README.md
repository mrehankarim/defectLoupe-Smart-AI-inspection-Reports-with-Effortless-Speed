# media-service

Photo uploads, voice notes, Cloudflare R2 storage, Whisper STT pipeline.

## Scope

- **Tables owned:** `area_photos`, `area_observations`, `transcriptions`
- **Routes:** `/api/v1/areas/{id}/photos`, `/api/v1/areas/{id}/observations`,
  `/api/v1/photos/{id}`, `/api/v1/photos/{id}/observations`,
  `/api/v1/observations/{id}/transcribe`, `/api/v1/transcriptions/{id}`,
  `/api/v1/inspections/{id}/media`
- **Owner:** M3 (Media + Transcription Lead)

## Run locally

```bash
cd services/media
cp app/.env.example app/.env     # fill R2 keys
uvicorn app.main:app --reload --port 8003

# In another terminal — Celery worker for STT
celery -A app.workers.celery_app worker -l info -Q stt
```

## Docker build

```bash
docker build --build-arg SERVICE_NAME=media -f services/media/Dockerfile -t defectloupe-media .
```

## Dependencies on other services

- Decodes JWT locally via `shared/auth_deps.py`.
- Accepts `area_id`, `photo_id`, `inspection_id` as URL path params — validates them against its own tables (shared DB) rather than calling core-service.
- Publishes Celery tasks to Redis `stt` queue.
