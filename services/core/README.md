# core-service

Business logic: clients, properties, inspections, inspection areas, dashboard stats.

## Scope

- **Tables owned:** `clients`, `properties`, `inspections`, `inspection_areas`
- **Routes:** `/api/v1/clients`, `/api/v1/properties`, `/api/v1/inspections`,
  `/api/v1/inspections/{id}/areas`, `/api/v1/dashboard/stats`
- **Owner:** M2 (Core Business Lead)

## Run locally

```bash
cd services/core
cp app/.env.example app/.env
uvicorn app.main:app --reload --port 8002
```

## Docker build

```bash
docker build --build-arg SERVICE_NAME=core -f services/core/Dockerfile -t defectloupe-core .
```

## Dependencies on other services

- Decodes JWT locally via `shared/auth_deps.py` (same `ACCESS_TOKEN_SECRET` as auth-service).
- No cross-service HTTP calls needed for MVP.
