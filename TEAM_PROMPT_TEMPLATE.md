# DefectLoupe — AI Agent Onboarding Prompt

> Copy this entire prompt and give it to your AI coding agent (Cursor, Copilot, Qoder, etc.).
> Replace `[MEMBER: X]` at the top with your member number (M1, M2, M3, or M4) before pasting.

---

## I am MEMBER: M3

---

## Project Context

You are helping me build **DefectLoupe**, an AI-powered property inspection platform for a hackathon. The MVP deadline is **September 1, 2026**. We are a team of 4, each owning a distinct microservice + their own web pages. I am **Member [X]**.

### Tech Stack
- **Backend:** FastAPI (Python 3.11), SQLAlchemy 2.0, Uvicorn
- **Database:** PostgreSQL 15 + pgvector (for vector embeddings)
- **Message Broker:** Redis 7 (Celery task queue for async jobs)
- **File Storage:** Cloudinary (image/video storage + CDN), local fallback for dev
- **Vision AI:** Google Gemini 1.5 Flash (free tier)
- **Speech-to-Text:** faster-whisper (local) via Celery worker
- **RAG Embeddings:** HuggingFace `all-MiniLM-L6-v2` (384-dim, via sentence-transformers)
- **Report PDF:** Jinja2 HTML templates → WeasyPrint
- **Mobile:** React Native + Expo (sole owner: M4)
- **Web:** React + Vite + Tailwind CSS
- **Infrastructure:** Docker + Docker Compose, Traefik v3 as API gateway

### Architecture

The project is a **monorepo with microservices**. Each backend service has its own folder under `services/`, its own Dockerfile, requirements.txt, and FastAPI app. All services share a PostgreSQL database and Redis instance.

```
DefectLoupe/
├── services/
│   ├── auth/          # M1 — users, JWT, RBAC, email, inspectors
│   ├── core/          # M2 — clients, properties, inspections, areas, dashboard
│   ├── media/         # M3 — photos, observations, R2 storage, STT
│   ├── ai/            # M4 — RAG, vision AI, report generation, PDF
│   └── gateway/       # M1 (DevOps) — Traefik config
├── shared/            # Cross-cutting package (imported by every service)
│   ├── db_config.py   # SQLAlchemy engine + sessionmaker + get_db()
│   ├── base.py        # DeclarativeBase for all models
│   ├── password.py    # Argon2 hash/verify via pwdlib
│   └── auth_deps.py   # JWT decode dependencies (get_current_user, get_current_inspector)
├── web/               # React + Vite dashboard (each member owns pages)
├── mobile/            # React Native + Expo (M4 sole owner)
├── docker-compose.yaml
└── PLAN.md            # Full day-by-day hackathon plan
```

### How Docker Works

- All 4 Python services listen on **port 8000** inside their containers
- Traefik gateway on port 80 routes by path prefix to the correct service
- PostgreSQL on internal port 5432 (host port 5433)
- Redis on port 6379
- Build context is the repo root (so `shared/` can be COPY'd into every image)
- Each Dockerfile receives `SERVICE_NAME` build arg to COPY the correct service code

To run everything:
```bash
docker compose up --build
```

To run just YOUR service locally (without Docker):
```bash
cd services/<your-service>/app
pip install -r ../requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Shared Package

The `shared/` folder is COPY'd into every Docker image at `/app/shared/`. Every service can import from it:
```python
from shared.db_config import get_db, SessionLocal, engine
from shared.base import Base
from shared.password import hash_password, verify_password
from shared.auth_deps import get_current_user, get_current_inspector
```

### Environment Variables

Each service has `.env.example` in `services/<name>/app/.env.example`. Copy it to `.env` and fill in values. Docker-compose overrides `DATABASE_URL` and cross-service URLs automatically.

---

## My Role: Member 3

### Member Assignments (for reference)

| Member | Backend Service | Web Pages | Other |
|---|---|---|---|
| **M1** | auth-service | Login, Signup, Dashboard shell, Settings, Profile | DevOps: Traefik, docker-compose, shared auth_deps |
| **M2** | core-service | Clients, Properties, Inspections (list + detail + areas) | — |
| **M3** | media-service | Media gallery, Voice note player, Transcription editor | — |
| **M4** | ai-service | Report viewer, QR verify page, RAG upload | **Sole owner of mobile app** |

### My Specific Scope



- **Service:** `services/media/` — Photo upload to Cloudinary, voice note upload, text/voice observations, Celery transcription worker (faster-whisper), image optimization (thumbnails, EXIF), audio format validation
- **Web pages:** Area media gallery, Voice note player with waveform, Transcription review/editor
- **Models to create:** `AreaPhoto`, `AreaObservation`, `Transcription` (repositories already exist in `services/media/app/repository/`)
- **Mocking:** Accept `area_id` and `photo_id` as UUIDs from URL params — no call to core-service needed
- **Branch:** Create your own branch from `main`



## Independence Contract

No member blocks another. Cross-service data is **mocked** until integration day (Day 3), then swapped to real HTTP calls.

- JWT is decoded locally in every service using `shared/auth_deps.py` + the same `ACCESS_TOKEN_SECRET`
- Cross-service IDs (area_id, photo_id, inspection_id) are passed as URL path params
- Cross-service HTTP calls use `httpx` and point to `http://core:8000` or `http://media:8000` (Docker internal DNS)

---

## Conventions

- **Commit messages:** Simple, plain text. NO conventional commit prefixes (no `fix:`, `feat:`, `refactor:`, `chore:`, etc.)
- **Python style:** Match existing code — type hints on function signatures, docstrings on modules
- **Imports from shared:** Always `from shared.X import Y` (never relative imports)
- **Database models:** Inherit from `shared.base.Base`, use SQLAlchemy 2.0 Mapped[] syntax
- **DTOs:** Use Pydantic v2 BaseModel with `model_config = ConfigDict(from_attributes=True)`
- **Routes:** FastAPI APIRouter with `/api/v1/` prefix for your service's resources

---

## Getting Started — Day 1 Tasks

1. Read `PLAN.md` in the repo root — it has the full day-by-day plan and detailed task breakdown
2. Create your branch from `main`: `git checkout -b feature/<your-name>`
3. Set up your `.env` from `.env.example`: `cp services/<your-service>/app/.env.example services/<your-service>/app/.env`
4. Start building your service models, services, routes, and DTOs
5. After every ~5 commits, create a PR to `main`. Merge when ready.

---

## Files to Check First

- `PLAN.md` — full hackathon plan, data model, day-by-day tasks
- `docker-compose.yaml` — service orchestration, ports, environment
- `shared/` — the cross-cutting package you'll import from
- `services/<your-service>/app/main.py` — your service entry point (routes are commented out, uncomment when you build them)
- `services/<your-service>/app/repository/` — existing model/repository files (for auth, core, media)
- `services/<your-service>/requirements.txt` — your service's Python dependencies
