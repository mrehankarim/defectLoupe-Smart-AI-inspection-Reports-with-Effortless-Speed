# gateway

Traefik v3 reverse proxy — single public entry point for all services.

## Routes (configured via Docker labels)

| Path prefix | Backend service |
|---|---|
| `/auth`, `/inspectors`, `/api/v1/auth` | auth (8001) |
| `/api/v1/clients`, `/api/v1/properties`, `/api/v1/inspections`, `/api/v1/dashboard` | core (8002) |
| `/api/v1/areas`, `/api/v1/photos`, `/api/v1/observations`, `/api/v1/transcriptions` | media (8003) |
| `/api/v1/rag`, `/api/v1/reports`, `/photos/{id}/analyze` | ai (8004) |

## Dashboard

Traefik dashboard (insecure, dev only) — http://localhost:8080

## Files

- `traefik.yaml` — static config (entrypoints, Docker provider)
- Routes come from Docker labels in `docker-compose.yaml` (dynamic config)
