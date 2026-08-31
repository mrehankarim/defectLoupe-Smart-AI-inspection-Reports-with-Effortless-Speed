# DefectLoupe — Hackathon Execution Plan

> **MVP Deadline:** September 1, 2026 (4 days: Aug 29 – Sep 1)
> **Polish + Demo Deadline:** September 4, 2026 (+3 days: Sep 2 – Sep 4)
> **Team:** 4 full-stack members, all generalists
> **Demo format:** Full live demo on phone (React Native / Expo)

---

## 1. Tech Stack Decisions

| Layer | Technology | Notes |
|---|---|---|
| **Backend API** | FastAPI (Python 3.11) + Uvicorn | Already scaffolded — auth, JWT, email verification done |
| **Database** | PostgreSQL 15 + pgvector | Already running via Docker Compose |
| **File Storage** | Cloudinary (image/video storage + CDN) | Free tier: 25 GB storage, 25 GB bandwidth/month. Local fallback for dev |
| **Mobile App** | React Native + Expo | Primary demo surface. Expo Camera + Audio for capture |
| **Web Dashboard** | React + Vite + Tailwind CSS | Bonus — inspector dashboard, report viewer |
| **Vision AI** | Google Gemini 1.5 Flash | Free tier: 15 RPM, generous daily quota. Best for defect detection |
| **Speech-to-Text** | faster-whisper (local) or OpenAI Whisper API | faster-whisper for free/local, OpenAI Whisper API as fallback |
| **RAG Embeddings** | HuggingFace `all-MiniLM-L6-v2` (via sentence-transformers) | Free, runs locally, 384-dim vectors. Stored in pgvector |
| **Report PDF** | Jinja2 HTML → WeasyPrint | Free, full control over styling, company branding |
| **Containerization** | Docker + Docker Compose (microservices) | One container per service, orchestrated via Compose |
| **Inter-Service Comms** | HTTP/REST (sync) + Redis-backed queue (async) | Services call each other via internal Docker network; async jobs (STT, report generation) via Redis/Celery |
| **API Gateway** | Traefik or Nginx reverse proxy | Single entry point, routes to services by path prefix |
| **Message Broker** | Redis 7 (lightweight) | Celery task queue for async jobs (transcription, report generation). Also used for simple pub/sub events |

---

## 1b. Microservices Architecture

The monolith (`app/`) is split into **5 independent services**, each with its own Dockerfile, `requirements.txt`, and FastAPI app. They share a PostgreSQL database (separate schemas) and a Redis instance for async tasks.

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Traefik)                      │
│                   localhost:80 (entry point)                  │
│         /auth/* → auth-svc   /inspections/* → core-svc        │
│         /media/* → media-svc  /ai/* → ai-svc                  │
└──────┬────────────┬────────────┬────────────┬───────────────┘
       │            │            │            │
   ┌───▼───┐   ┌───▼───┐   ┌───▼───┐   ┌───▼───┐
   │ auth  │   │ core  │   │ media │   │  ai   │
   │ svc   │   │ svc   │   │ svc   │   │ svc   │
   └───┬───┘   └───┬───┘   └───┬───┘   └───┬───┘
       │           │           │           │
       └───────────┼───────────┼───────────┘
                   │           │
              ┌────▼───┐  ┌───▼───┐
              │ Postgres│  │ Redis │
              │ +pgvector│ │(queue)│
              └─────────┘  └───────┘
                                 │
                       ┌─────────┼─────────┐
                       │ Celery Workers    │
                       │ • STT worker      │
                       │ • Report worker   │
                       │ • Vision worker   │
                       └───────────────────┘
```

### Service Breakdown

| Service | Port (internal) | Scope | Key Files | Owns Tables |
|---|---|---|---|---|
| **auth-service** | 8000 | User registration, login, JWT, email verification, RBAC | `auth/` | `users`, `inspectors`, `companies` |
| **core-service** | 8000 | Clients, Properties, Inspections, Areas, Dashboard | `core/` | `clients`, `properties`, `inspections`, `inspection_areas` |
| **media-service** | 8000 | Photo upload, voice notes, Cloudinary storage, transcription trigger | `media/` | `area_photos`, `area_observations`, `transcriptions` |
| **ai-service** | 8000 | RAG (pgvector), Vision AI (Gemini), Report generation, PDF | `ai/` | `document_chunks`, `report_jobs` |
| **api-gateway** | 80 (host) | Traefik reverse proxy, path routing, CORS, rate limiting | `gateway/` | none |
| **celery-workers** | n/a | Async background jobs (STT, vision, reports) | shared `ai/` + `media/` code | none |
| **PostgreSQL** | 5432 (5433 host) | Shared database (separate schemas per service) | — | all tables |
| **Redis** | 6379 | Celery broker + simple event bus | — | none |

### Folder Structure (monorepo with service directories)

```
DefectLoupe/
├── services/
│   ├── auth/
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── api/routes/
│   │   │   ├── api/dtos/
│   │   │   ├── repository/     # users, inspectors, companies
│   │   │   ├── services/
│   │   │   └── utils/          # jwt, password, cookie helpers
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── core/
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── api/routes/
│   │   │   ├── api/dtos/
│   │   │   ├── repository/     # clients, properties, inspections, areas
│   │   │   └── services/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── media/
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── api/routes/
│   │   │   ├── repository/     # area_photos, area_observations, transcriptions
│   │   │   ├── services/
│   │   │   └── utils/          # storage.py (Cloudinary), audio.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── ai/
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── api/routes/
│   │   │   ├── repository/     # document_chunks, report_jobs
│   │   │   ├── services/       # rag, vision, report, embeddings
│   │   │   └── workers/        # Celery task definitions
│   │   ├── templates/          # Jinja2 report templates
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── gateway/
│       ├── traefik.yaml
│       └── Dockerfile
├── shared/
│   └── db_config.py            # shared SQLAlchemy engine + session
├── docker-compose.yaml         # orchestrates all 6 services + PG + Redis
├── .env                        # shared env vars
└── PLAN.md
```

### `docker-compose.yaml` (target shape)

```yaml
services:
  gateway:
    image: traefik:v3.0
    command:
      - "--providers.docker"
      - "--entrypoints.web.address=:80"
    ports:
      - "80:80"
      - "8080:8080"    # Traefik dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks: [defectloupe-net]

  auth:
    build: ./services/auth
    labels:
      - "traefik.http.routers.auth.rule=PathPrefix(`/auth`) || PathPrefix(`/inspectors`)"
      - "traefik.http.services.auth.loadbalancer.server.port=8000"
    environment: { DATABASE_URL, JWT secrets, Resend key }
    networks: [defectloupe-net]

  core:
    build: ./services/core
    labels:
      - "traefik.http.routers.core.rule=PathPrefix(`/api/v1/clients`) || PathPrefix(`/api/v1/properties`) || PathPrefix(`/api/v1/inspections`) || PathPrefix(`/api/v1/dashboard`)"
      - "traefik.http.services.core.loadbalancer.server.port=8000"
    depends_on: [auth, db]
    networks: [defectloupe-net]

  media:
    build: ./services/media
    labels:
      - "traefik.http.routers.media.rule=PathPrefix(`/api/v1/areas`) || PathPrefix(`/api/v1/photos`) || PathPrefix(`/api/v1/observations`) || PathPrefix(`/api/v1/transcriptions`)"
      - "traefik.http.services.media.loadbalancer.server.port=8000"
    depends_on: [auth, core, db, redis]
    environment: { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, REDIS_URL }
    networks: [defectloupe-net]

  ai:
    build: ./services/ai
    labels:
      - "traefik.http.routers.ai.rule=PathPrefix(`/api/v1/rag`) || PathPrefix(`/api/v1/reports`)"
      - "traefik.http.services.ai.loadbalancer.server.port=8000"
    depends_on: [auth, core, media, db, redis]
    networks: [defectloupe-net]

  celery-worker:
    build: ./services/ai
    command: celery -A app.workers.celery_app worker -l info -Q stt,vision,reports
    depends_on: [redis, db, media, ai]
    networks: [defectloupe-net]

  db:
    image: ankane/pgvector:latest
    environment: { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB }
    ports: ["5433:5432"]
    volumes: [defectloupe-data:/var/lib/postgresql/data]
    networks: [defectloupe-net]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    networks: [defectloupe-net]

networks: { defectloupe-net: { driver: bridge } }
volumes: { defectloupe-data: {} }
```

### Inter-Service Communication Patterns

| Pattern | Use Case | Implementation |
|---|---|---|
| **Sync HTTP (internal)** | core-service calls auth-service to validate JWT on every request | Shared `get_current_user()` dependency — each service decodes JWT locally (same secret), no cross-call needed for auth. For cross-service data lookups, use `httpx.AsyncClient` on internal Docker network |
| **Async Queue (Celery)** | media-service triggers transcription after voice upload | media-service publishes task to Redis `stt` queue → Celery worker picks it up → writes result to DB → media-service polls via `GET /transcriptions/{id}/status` |
| **Async Queue (Celery)** | core-service triggers report generation | core-service publishes task to Redis `reports` queue → ai-service Celery worker runs → writes PDF URL + JSON to `report_jobs` table → mobile polls `GET /inspections/{id}/report/status` |
| **Shared DB** | All services read/write PostgreSQL | Each service owns its own tables (schema ownership). Cross-service reads go directly to DB (simpler for hackathon than event sourcing) |
| **Event Bus (Redis pub/sub)** | Future: notify mobile via WebSocket when report is ready | Redis publish on channel `reports.ready` → any subscriber can react |

### Why Microservices Here

1. **Team parallelism** — 4 members work on 4 different services with zero merge conflicts (each has its own folder, Dockerfile, requirements)
2. **Independent deployment** — AI service can be rebuilt/redeployed without touching auth or core
3. **Resource isolation** — AI service needs heavy ML deps (sentence-transformers, torch) — keeps them out of the auth service image
4. **Scaling** — Celery workers can be scaled horizontally (`docker compose up --scale celery-worker=3`) if report generation needs parallelism
5. **Demo resilience** — If the AI service crashes during demo, auth + core + media still work; you can show the inspection flow and say "report generation is temporarily unavailable"

### Migration Plan (current monolith → microservices)

| Day | Action |
|---|---|
| **Day 1 morning** | Restructure folders: move current `app/` files into `services/auth/app/` (auth already works) |
| **Day 1 morning** | Create empty service scaffolds for `services/core/`, `services/media/`, `services/ai/`, `services/gateway/` with minimal `main.py` + `Dockerfile` |
| **Day 1 morning** | Write new `docker-compose.yaml` with all 6 services + Traefik + Redis |
| **Day 1 afternoon** | Verify: `docker compose up` launches all 6 services, Traefik routes work, auth-service still handles login |
| **Day 2+** | Each member builds inside their own service directory. Shared `db_config.py` in `shared/` folder |

---

## 2. Data Model — Current State vs. Required Changes

### What Already Exists (✅ Working Today)
- `users` — email, password, JWT, email verification
- `inspectors` — first/last name, phone, license, type (INDIVIDUAL / AGENCY_MEMBER), linked to user + optional company
- `companies` — name, address, owner (inspector), branding
- `clients` — name, email, phone, linked to inspector and/or company
- `properties` — address, type, year built, square footage, linked to client
- `inspections` — inspector, property, status, title, notes
- `inspection_areas` — name, display order, linked to inspection
- `area_photos` — photo URL, linked to area
- `area_observations` — text or voice, linked to area and optionally to a photo
- `transcriptions` — transcription text, confidence, linked to observation

### Auth Flow Already Working
1. `POST /auth/register` → creates User + Inspector (INDIVIDUAL) + sends email
2. `GET /auth/verify-email` → verifies token
3. `POST /auth/login` → JWT cookies (access 15m + refresh 10d)
4. `POST /auth/refresh` → rotates tokens, detects reuse
5. `POST /inspectors/company` → individual creates agency, becomes owner
6. `POST /inspectors/company/inspectors` → owner adds sub-inspectors

### What Needs to Be Built
| # | What | Current State | Action Required |
|---|---|---|---|
| 1 | Client CRUD (create, list, update, delete) | Model exists, **no API routes** | Build routes + service + DTOs |
| 2 | Property CRUD | Model exists, **no API routes** | Build routes + service + DTOs |
| 3 | Inspection lifecycle + state machine | Model has basic status enum | Add full state machine: DRAFT → SCHEDULED → IN_PROGRESS → COMPLETED → REPORT_GENERATED |
| 4 | Inspection area management | Model exists, **no API routes** | Build routes + reorder logic |
| 5 | Photo upload + storage | Model exists, **no routes/storage** | Cloudinary upload service, multipart endpoint |
| 6 | Voice note upload + STT | Model exists, **no pipeline** | Upload endpoint + async Whisper transcription |
| 7 | RAG vector store | pgvector available, **no schema/service** | Add document_chunks table, ingestion, search |
| 8 | Vision AI defect detection | **Nothing** | Gemini Flash integration |
| 9 | Report generation | **Nothing** | Jinja2 + WeasyPrint PDF pipeline |
| 10 | Multi-language reports | **Nothing** | Translation layer (bonus) |

### Schema Additions Needed

```python
# New table: document_chunks (for RAG knowledge base)
class DocumentChunk(Base):
    id: UUID (PK)
    company_id: UUID (FK → companies, nullable)  # null = global knowledge
    filename: str
    chunk_text: str
    embedding: Vector(384)          # pgvector column
    metadata: JSON                   # trade, category, severity hints
    uploaded_by: UUID (FK → inspectors)
    created_at: timestamp

# New table: report_jobs (track async report generation)
class ReportJob(Base):
    id: UUID (PK)
    inspection_id: UUID (FK → inspections)
    status: enum (QUEUED, PROCESSING, READY, FAILED)
    report_pdf_url: str (nullable)
    report_json: JSON (nullable)     # structured report data
    generated_by: UUID (FK → inspectors)
    error_message: str (nullable)
    created_at: timestamp
    completed_at: timestamp (nullable)

# Add columns to existing models:
# inspections.status: add DRAFT, SCHEDULED, REPORT_GENERATED, ARCHIVED values
# inspection_areas: add defect_count, photo_count (computed/cached)
# area_photos: add analyzed (bool), defect_labels (JSON, nullable)
# transcriptions: add status enum (PENDING, PROCESSING, COMPLETED, FAILED), duration_seconds (float)
```

---

## 3. Team Role Assignment

### Core Principle: True Independence
Every member works end-to-end on their own vertical (models → service → routes → UI) with **zero blocking dependencies**. No member waits on another to start. Cross-service data is mocked until integration day, then swapped to real calls.

### Member Assignments

| Member | Alias | Backend Service | Web Pages Owned | Mobile |
|---|---|---|---|---|
| **M1** | Auth + Web Shell Lead | `auth-service` (users, inspectors, companies, JWT, RBAC, email) | Login, Signup, Dashboard shell, Settings, Profile | ❌ |
| **M2** | Core Business Lead | `core-service` (clients, properties, inspections, areas, dashboard stats) | Clients (list + create + detail), Properties (list + create), Inspections (list + detail + area management) | ❌ |
| **M3** | Media + Transcription Lead | `media-service` (photos, observations, Cloudinary storage, STT pipeline) | Media gallery per area, Voice note player, Transcription editor | ❌ |
| **M4** | Mobile + AI Lead | `ai-service` (RAG, vision, reports) + **full mobile app** | Report viewer (PDF embed), Public QR verify page, RAG document upload | ✅ **Sole owner** |

### What Each Member Delivers End-to-End

**M1 (auth-service + web auth shell)**
- Backend: User register/login/logout/refresh, email verify, inspector profile, company creation, adding sub-inspectors, RBAC, shared JWT decode utility (`shared/auth_deps.py`) used by all services
- Web: Login page, signup page, dashboard layout (sidebar + header), settings/profile page
- DevOps: Traefik gateway config, `docker-compose.yaml`, shared `.env`, healthchecks

**M2 (core-service + web business pages)**
- Backend: Client CRUD, property CRUD, inspection lifecycle + state machine, inspection area management with reordering, dashboard statistics, tenant-scoped queries
- Web: Clients page (table + form), properties page, inspection list with filters, inspection detail with area management
- Mocking: decodes JWT locally to get `inspector_id`/`company_id` — no call to auth-service needed

**M3 (media-service + web media gallery)**
- Backend: Photo upload to Cloudinary, voice note upload, text/voice observations, Celery transcription worker, image optimization (thumbnails, EXIF), audio format validation
- Web: Media gallery per inspection area, voice note player with waveform, transcription review/editor page
- Mocking: accepts `area_id` and `photo_id` as UUIDs directly from the URL — no call to core-service needed. Uses mock inspection data for gallery display.

**M4 (ai-service + full mobile app + web report viewer)**
- Backend: RAG document ingestion, vector similarity search, Gemini vision analysis, Celery report generation worker, Jinja2 PDF reports, QR verification endpoint
- Web: Report viewer page (PDF embed), public QR verify page, RAG document upload page
- Mobile: **sole owner** — entire React Native app (auth screens, dashboard, client/property/inspection flows, camera, voice recording, transcription review, report viewer, offline sync)
- Mocking: accepts `photo_id` and `inspection_id` from URL params. Uses sample photos + dummy text for RAG testing. Vision service works with any image URL.
- **Priority rule:** Mobile first. Web report viewer is built only after mobile report viewer works.

### Independence Contract (No Member Blocks Another)

Every member commits to this contract from Day 1:

| Dependency | How It's Handled (no waiting) |
|---|---|
| JWT validation (all services) | Each service imports `shared/auth_deps.py` which decodes the JWT locally using the same `ACCESS_TOKEN_SECRET`. No HTTP call to auth-service. |
| M2 needs `inspector_id` | Extracted from JWT payload by `get_current_inspector()` dependency. Already works standalone. |
| M3 needs `area_id` / `photo_id` | Passed as URL path params. M3's endpoints validate them against the `area_photos`/`inspection_areas` tables in shared DB. No call to core-service. |
| M4 needs inspection context | `GET /inspections/{id}/full-context` is mocked in M4's code with a hardcoded JSON fixture until M2's endpoint is ready (swap to `httpx.AsyncClient("http://core:8000/...")` on integration day). |
| M4 needs photos for vision | `GET /photos/{id}` mocked with a local sample image; swap to media-service call on integration day. |
| M4 needs transcriptions | `GET /transcriptions?observation_ids=...` mocked with fixture data; swap to media-service on integration day. |
| M2 needs client email verification | Handled entirely inside core-service (no auth-service call). |
| M3 needs tenant scope | Decoded from JWT locally (same pattern as M2). |
| Web needs backend | Each member runs their own service locally + hits it via `localhost:8000` directly during dev (one service at a time) or uses `docker compose up` for all. Traefik at `:80` is only for integration. |
| Mobile needs all APIs | M4 develops against local services + mock JSON fixtures. Once services are up on integration day, switch the Axios `baseURL` from mock server to `http://localhost`. |

### Integration Day (Day 3 of sprint) — All Mocks Become Real
1. Swap all mock stubs → real cross-service HTTP calls via `httpx`
2. Run all services through Traefik at `localhost:80`
3. Mobile flips Axios `baseURL` to `http://localhost`
4. Run end-to-end smoke test: signup → login → create client → create property → start inspection → add areas → upload photo → record voice → trigger transcription → analyze defects → generate report → view PDF

### Mobile App — Sole Owner: M4
M4 is the **only** member who touches `DefectLoupeMobile/`. All other members stay out of the mobile folder to avoid merge conflicts.

M4's mobile scope (build incrementally across days):
- Auth screens (login, signup, email verify)
- Dashboard + navigation
- Client + property list/create
- Inspection list + create + detail + area management
- Camera capture + photo gallery
- Voice recording + playback
- Transcription review + edit
- Report generation trigger + PDF viewer
- Offline mode (SQLite queue + auto-sync)

### Web Dashboard — Each Member Owns Their Slice

| Member | Web Pages |
|---|---|
| **M1** | Login, Signup, Dashboard shell (layout + sidebar), Settings, Profile |
| **M2** | Clients (list + create + detail), Properties (list + create), Inspections (list + detail + area management) |
| **M3** | Area media gallery, Voice note player, Transcription editor |
| **M4** | Report viewer (PDF embed), Public QR verify page, RAG document upload |

**Rule:** M1 scaffolds the React+Vite+Tailwind project on Day 1 (layout, sidebar, routing, Axios client with cookie auth). M2, M3, M4 then build their pages inside that scaffold, each in their own folder (`src/pages/clients/`, `src/pages/media/`, `src/pages/reports/`).

---

## 4. Detailed Day-by-Day Plan

---

### DAY 1 — Saturday, August 29 (TODAY — Setup + Microservices Restructure + Kickoff)

#### Morning Part 1 (1–2 hours) — All Members Together: Microservices Restructure
- [ ] **Restructure monolith → microservices** — move current `app/` into `services/auth/app/` (auth is the only fully-built service)
- [ ] **Create service scaffolds** — empty `services/core/`, `services/media/`, `services/ai/`, `services/gateway/` each with `app/main.py`, `Dockerfile`, `requirements.txt`
- [ ] **Create `shared/` folder** — move `db_config.py` and `base.py` (SQLAlchemy declarative base) into `shared/` so all services import from the same place
- [ ] **Write new `docker-compose.yaml`** — 6 services (gateway, auth, core, media, ai, celery-worker) + PostgreSQL + Redis
- [ ] **Add Traefik gateway** — route `/auth/*` and `/inspectors/*` to auth-service (port 8000), add stub labels for core/media/ai
- [ ] **Verify microservices launch** — `docker compose up --build` should start all 8 containers. Health check each service via Traefik at `localhost:80`
- [ ] **Create shared `.env`** — single env file at root with all service variables (each service reads what it needs)

#### Morning Part 2 (1–2 hours) — Planning + Project Init
- [ ] **API contract freeze** — Agree on all endpoint paths, request/response shapes (write to `API_CONTRACTS.md`)
- [ ] **Shared dependency design** — M1 defines `get_current_user()`, `get_current_inspector()`, `require_company_owner()` signatures in `shared/auth_deps.py` for M2–M4 to depend on (JWT decode is local to each service — same secret, no cross-service call needed)
- [ ] **Git branching** — Create `develop` branch + 4 feature branches: `feature/m1-auth-rbac`, `feature/m2-clients-inspections`, `feature/m3-media-stt`, `feature/m4-rag-mobile`
- [ ] **M4: Expo project init** — `npx create-expo-app DefectLoupeMobile` with expo-camera, expo-av, expo-document-picker, @react-navigation, react-native-reanimated, axios, @react-native-async-storage/async-storage, expo-secure-store. Commit to `feature/m4-rag-mobile`.
- [ ] **M1: React web project init** — `npm create vite@latest defectloupe-web -- --template react-ts` + Tailwind CSS setup + Axios API client (base URL = `http://localhost` via Traefik). Commit to `feature/m1-auth-rbac`.
- [ ] **M1: Create Cloudinary account** — Set up Cloudinary account + get API keys, add to `.env`
- [ ] **M3: Spin up Redis** — verify `redis-cli ping` works inside the Redis container

#### Afternoon/Evening (4–5 hours) — Parallel Development Starts

**M1 (auth-service + web scaffold):**
- [ ] Move existing auth code into `services/auth/app/` — update imports to use `shared.db_config` and `shared.base`
- [ ] Create `services/auth/app/utils/security.py` — centralize `get_current_user`, `get_current_inspector`, tenant-scope helpers
- [ ] Add `require_role()` decorator for RBAC (ADMIN, INSPECTOR, CLIENT_VIEWER)
- [ ] Set up `alembic init` inside `services/auth/` for database migrations on user/inspector/company tables
- [ ] Create API versioning structure (`/api/v1/` prefix on all auth/inspector routes)
- [ ] Add CORS middleware for mobile + web clients
- [ ] Update Traefik labels in `services/auth/docker-compose` section to route `/auth/*` and `/inspectors/*`
- [ ] **Scaffold React+Vite+Tailwind web project** (do this during the "React web project init" slot in Morning Part 2): layout (sidebar + header), React Router, Axios client with cookie auth + 401 refresh interceptor, stub route folders for other members (`src/pages/clients/`, `src/pages/properties/`, `src/pages/inspections/`, `src/pages/media/`, `src/pages/reports/`) each with a placeholder `index.tsx`, Login + Signup pages, auth context/provider, protected route wrapper. Push to shared repo so M2/M3/M4 can pull on Day 2.

**M2 (core-service):**
- [ ] Scaffold `services/core/app/` with `main.py`, `Dockerfile`, `requirements.txt` (FastAPI + SQLAlchemy + shared deps)
- [ ] Create `services/core/app/api/dtos/client_dto.py` — CreateClientRequest, UpdateClientRequest, ClientResponse, ClientListResponse
- [ ] Create `services/core/app/services/client_service.py` — create_client, list_clients, get_client, update_client, delete_client
- [ ] Create `services/core/app/api/routes/client_routes.py` — GET/POST /clients, GET/PATCH/DELETE /clients/{id}
- [ ] Tenant scoping: individual inspector sees own clients, agency inspector sees company clients (decode JWT locally to get inspector_id/company_id)
- [ ] Register client router in `services/core/app/main.py`, add Traefik labels in compose
- [ ] Verify core-service is reachable via `localhost/api/v1/clients` through Traefik

**M3 (media-service):**
- [ ] Scaffold `services/media/app/` with `main.py`, `Dockerfile`, `requirements.txt` (FastAPI + cloudinary + shared deps)
- [ ] Create `services/media/app/utils/storage.py` — Cloudinary upload/download abstraction (cloudinary SDK), with local file fallback for dev
- [ ] Create `services/media/app/api/dtos/photo_dto.py` — UploadPhotoResponse, PhotoResponse
- [ ] Create `services/media/app/api/routes/photo_routes.py` — POST /areas/{area_id}/photos (multipart), GET /areas/{area_id}/photos, DELETE /photos/{id}
- [ ] Set up Cloudinary configuration in media-service config_loader
- [ ] Add Redis connection + Celery app init inside media-service (`services/media/app/celery_app.py`)
- [ ] Test photo upload → Cloudinary → return URL flow

**M4 (ai-service + mobile init):**
- [ ] Scaffold `services/ai/app/` with `main.py`, `Dockerfile`, `requirements.txt` (FastAPI + sentence-transformers + google-generativeai + weasyprint + jinja2 + celery)
- [ ] Create `services/ai/app/repository/document_chunk.py` — SQLAlchemy model with pgvector `Vector(384)` column
- [ ] Create `services/ai/app/services/embeddings_service.py` — load `all-MiniLM-L6-v2` model, generate embeddings, chunk text
- [ ] Create `services/ai/app/api/routes/rag_routes.py` — POST /rag/documents/upload (ingest specs/past reports)
- [ ] Install `sentence-transformers` inside ai-service Docker image and test embedding generation
- [ ] Create initial RAG ingestion pipeline: upload file → chunk → embed → store in pgvector
- [ ] Set up Celery worker container (`celery -A app.workers.celery_app worker -Q stt,vision,reports`)
- [ ] **Continue mobile app** (Expo project was initialized by M4 in Morning Part 2): set up React Navigation (stack + tab navigator), create Axios API client with mock server fallback, build Login + Signup screens, store auth tokens in SecureStore, build basic Dashboard/Home screen scaffold

---

### DAY 2 — Sunday, August 30 (Core Feature Development)

> **Each member works on their backend service (morning) + their web pages (afternoon). M4 additionally builds mobile whenever backend is stable.**

#### Morning (3–4 hours) — Backend Services

**M1 (auth-service):**
- [ ] Build tenant isolation middleware — every query scoped to inspector.company_id or inspector.id
- [ ] Create `services/auth/app/utils/tenant_scope.py` — helper that returns the correct filter (solo inspector → own data; agency → company data)
- [ ] Add audit log model + service (track who did what, when)
- [ ] Write unit tests for auth flow (register, login, refresh, logout, verify email)

**M2 (core-service):**
- [ ] Create `services/core/app/api/dtos/property_dto.py` — CreatePropertyRequest, PropertyResponse, PropertyListResponse
- [ ] Create `services/core/app/services/property_service.py` — CRUD + link to client + property history
- [ ] Create `services/core/app/api/routes/property_routes.py` — GET/POST /properties, GET/PATCH/DELETE /properties/{id}, GET /clients/{id}/properties
- [ ] Create `services/core/app/api/dtos/inspection_dto.py` — CreateInspectionRequest, UpdateInspectionStatusRequest, InspectionResponse, InspectionListResponse
- [ ] Create `services/core/app/services/inspection_service.py` — create, list, update status with state machine, filter by date/status/inspector

**M3 (media-service):**
- [ ] Create `services/media/app/api/dtos/observation_dto.py` — CreateTextObservationRequest, CreateVoiceObservationRequest, ObservationResponse
- [ ] Create `services/media/app/api/routes/observation_routes.py` — POST /photos/{id}/observations, POST /areas/{id}/observations, GET /areas/{id}/observations
- [ ] Create `services/media/app/services/transcription_service.py` — async Whisper via Celery, status tracking (PENDING → PROCESSING → COMPLETED → FAILED)
- [ ] Create `services/media/app/api/routes/transcription_routes.py` — POST /observations/{id}/transcribe (publishes Celery task to `stt` queue), GET /transcriptions/{id}, PATCH /transcriptions/{id}
- [ ] Create Celery task `services/media/app/workers/transcribe_worker.py` — picks up audio files from Cloudinary, runs faster-whisper, writes result to `transcriptions` table

**M4 (ai-service):**
- [ ] Implement vector similarity search: POST /rag/search — query text → embed → pgvector cosine similarity → top-K results
- [ ] Create `services/ai/app/services/vision_service.py` — Gemini 1.5 Flash integration for defect photo analysis
- [ ] Build vision prompt template: "Analyze this property inspection photo. Identify defects, classify severity (Low/Medium/High/Critical), describe location, suggest remediation"
- [ ] Create POST /photos/{id}/analyze — calls Gemini vision, stores defect_labels JSON on area_photo
- [ ] Test with sample property photos

#### Afternoon (3–4 hours) — Web Pages + Continued Backend

**M1 (web auth + dashboard shell):**
- [ ] Build Dashboard shell page (sidebar + header + main content area, reusable layout for other pages)
- [ ] Build Settings page (profile info, change password, inspector/company details)
- [ ] Set up rate limiting on auth endpoints (slowapi or custom middleware)
- [ ] Integration sanity check: login → land on dashboard → sidebar navigates to other members' stubs

**M2 (web clients + properties + inspections):**
- [ ] Build Clients page: table with search/filter + create client modal + detail view
- [ ] Build Properties page: grid/list per client + create form + link to client
- [ ] Build Inspections page: list with status badges + filters (status/date/client) + create flow
- [ ] Build Inspection detail page: tabs for areas, photos, observations + area reorder
- [ ] Continue backend: `services/core/app/api/dtos/inspection_area_dto.py`, `services/core/app/services/area_service.py`, `services/core/app/api/routes/area_routes.py` (areas + reorder)
- [ ] Add inspection status transition validation (can't skip states)
- [ ] Create `services/core/app/api/routes/dashboard_routes.py` — GET /dashboard/stats

**M3 (web media gallery):**
- [ ] Build Media gallery page: grid of photos per inspection area (with thumbnails + EXIF timestamp)
- [ ] Build Voice note player component (audio waveform visualization, play/pause, download)
- [ ] Build Transcription editor page: side-by-side audio + editable text, save manual corrections
- [ ] Continue backend: image optimization (Pillow thumbnails + EXIF), audio format validation, Celery retry with exponential backoff, GET /transcriptions/{id}/status

**M4 (web report viewer + mobile continued):**
- [ ] **Mobile first:** Build Client List + Create Client screens, Property List + Create Property screens (link to client)
- [ ] **Mobile:** Build Inspection creation flow (select client → property → create → add areas) + detail screen
- [ ] **Web (only after mobile screens work):** Report viewer page (PDF embed via react-pdf or iframe), public QR verify page (read-only, no auth), RAG document upload page
- [ ] Continue backend: report context aggregator, Jinja2 report template, report service + Celery `report_worker`, POST /inspections/{id}/generate-report, GET /inspections/{id}/report/pdf + /status

---

### DAY 3 — Monday, August 31 (Integration Day + MVP Push)

#### Morning (3–4 hours) — Integration (All Mocks Become Real)
- [ ] Merge all 4 feature branches → `develop`, resolve conflicts
- [ ] Swap all mock stubs → real cross-service HTTP calls via `httpx` on Docker internal network (`http://core:8000`, `http://media:8000`, `http://ai:8000`)
- [ ] Run all services through Traefik at `localhost:80`
- [ ] Mobile flips Axios `baseURL` from mock server to `http://localhost`
- [ ] **End-to-end smoke test** (all members together, 30 min): signup → login → create client → create property → start inspection → add areas → upload photo → record voice → trigger transcription → analyze defects → generate report → view PDF
- [ ] Fix all integration bugs found

#### Afternoon (4–5 hours) — Each Member Finishes Their Vertical

**M1 (auth-service + web):**
- [ ] Finalize RBAC: agency owner vs. member vs. solo inspector permissions
- [ ] Security review: all endpoints require auth, tenant scoping works across services
- [ ] Polish web: add loading states, form validation, error toasts on login/signup/dashboard
- [ ] Add "current user" avatar/dropdown in web sidebar header

**M2 (core-service + web):**
- [ ] Add batch area creation from templates ("Standard Residential", "Commercial", "Pre-Purchase")
- [ ] Add dashboard stats: total inspections by status, completion rate
- [ ] Polish web: client/property/inspection tables, filters, detail pages, responsive design check
- [ ] Add inspection summary cards on dashboard (integrate with M1's dashboard shell)

**M3 (media-service + web):**
- [ ] Add GET /inspections/{id}/media — all photos + voice notes grouped by area
- [ ] Add media download endpoint (proxy Cloudinary through backend)
- [ ] Polish web: media gallery drag-to-reorder, voice note waveform, transcription editor save flow
- [ ] Test transcription with different audio formats and languages

**M4 (ai-service + mobile + web):**
- [ ] Complete report pipeline: context → Gemini Flash narrative → Jinja2 → WeasyPrint PDF
- [ ] Add report sections: Executive Summary, Property Overview, Area-by-Area Findings, Severity Matrix, Photo Gallery, Recommendations
- [ ] **Mobile:** Inspection walkthrough (navigate areas → take photos → record voice) + transcription review screen + report generation trigger + PDF viewer
- [ ] **Mobile:** loading states, error toasts, pull-to-refresh on all screens
- [ ] **Web:** connect report viewer to live API, PDF download button, QR verify page live

#### Evening — MVP Push
- [ ] All 4 members: fix P0 bugs from end-to-end test
- [ ] M4: test full mobile flow on real device (Expo Go)
- [ ] M1+M2: seed demo database (2 inspectors, 1 company, 3 clients, 5 properties, 2 completed inspections with photos + reports)

---

### DAY 4 — Tuesday, September 1 (MVP Completion + Polish Start)

#### Morning (2–3 hours) — Final MVP Fixes
- [ ] Each member: fix remaining P0 bugs in their own service + web pages
- [ ] M1: ensure all API endpoints return consistent error formats + proper DTO validation
- [ ] M2: add inspection search/filter (by status, date, client, inspector)
- [ ] M3: add photo ordering within areas, fix EXIF parsing edge cases
- [ ] M4 mobile: fix auth token auto-refresh on 401, test on real device, add splash screen + app icon
- [ ] M1+M2+M3 web: final responsive check on mobile viewport

#### Afternoon (3–4 hours) — MVP Feature Complete
- [ ] Full dry-run of demo flow on phone (M4 drives, others watch + note bugs)
- [ ] Full dry-run of web dashboard (M1 drives)
- [ ] Seed fresh demo data: realistic photos, real voice notes, branded reports
- [ ] Write API documentation (Swagger descriptions for each service)
- [ ] **MVP FEATURE FREEZE** — no new features after this point

#### Evening — Start Bonus Features (each member in their own vertical)
- [ ] M1: QR code generation on PDF reports + public QR verify endpoint
- [ ] M2: inspection area template library (pre-built area lists for different property types)
- [ ] M3: offline mode backend support (endpoint to accept batched sync payloads)
- [ ] M4 mobile: offline mode scaffold (SQLite local DB + action queue + sync engine)

---

### DAY 5 — Wednesday, September 2 (Bonus Features — each member in their vertical)

**M1 (auth-service + web):**
- [ ] QR code on PDF reports (backend: generate unique token per report, embed QR in WeasyPrint template)
- [ ] Public verify endpoint: `GET /reports/{token}/verify` (no auth required, returns report summary + "Verified by DefectLoupe" badge)
- [ ] Web: QR verify landing page (clean, branded, shows green "Verified" banner)

**M2 (core-service + web):**
- [ ] Inspection area templates: CRUD for templates, seed 3 defaults (Standard Residential, Commercial, Pre-Purchase)
- [ ] Web: template selector dropdown on inspection creation + drag-and-drop area reordering (react-beautiful-dnd)
- [ ] Client property history view: all inspections for a property over time on web

**M3 (media-service + web):**
- [ ] Multi-language transcription support (faster-whisper language detection)
- [ ] Photo watermarking (timestamp + GPS + inspector name overlay via Pillow)
- [ ] Web: language selector on transcription editor, watermark preview

**M4 (ai-service + mobile + web):**
- [ ] Multi-language report generation (Gemini Flash translation of report sections — English, Spanish, Urdu, Arabic)
- [ ] **Mobile:** offline mode completion (SQLite queue, auto-sync when online, conflict resolution, offline indicator banner)
- [ ] **Mobile:** QR code scanner (inspector scans client's report QR → opens verify page)
- [ ] **Mobile:** dark mode + polish animations (react-native-reanimated)
- [ ] **Web:** language selector on report viewer page

---

### DAY 6 — Thursday, September 3 (Polish + Demo Prep)

#### Morning — Polish
- [ ] Bug bash: fix all remaining P1 and P2 bugs
- [ ] Mobile: performance optimization (image lazy loading, list virtualization with FlatList)
- [ ] Backend: add request logging, performance profiling
- [ ] Web: add loading skeletons, empty states, error boundaries
- [ ] Test on slow network (throttle in Chrome DevTools)

#### Afternoon — Demo Prep
- [ ] **Write demo script** (5–7 minutes):
  1. Open app → login as inspector "Ali"
  2. Show dashboard with past inspections
  3. Create new inspection for client "Ahmed's Villa"
  4. Walk through areas: take real photo of a wall crack
  5. Record voice note: "Hairline crack observed on east wall, approximately 2 meters long"
  6. Show auto-transcription appearing
  7. Trigger AI report generation → show loading → report ready
  8. Open PDF report: branded, professional, with photos, severity matrix, recommendations
  9. Show QR code on report → scan it → verification page
  10. Show offline mode: disable WiFi → take photo → re-enable WiFi → auto-sync
- [ ] Seed fresh demo data (clean database, realistic photos, real voice notes)
- [ ] Prepare backup video recording of full demo (in case live demo fails)
- [ ] Test demo flow 3 times end-to-end

#### Evening — Presentation
- [ ] Build pitch deck (10–12 slides):
  - Problem statement (property inspection is manual, slow, error-prone)
  - Solution (AI-powered, voice-first, automated reports)
  - Demo video (backup)
  - Tech architecture diagram
  - Team roles
  - Business model / market opportunity
  - Future roadmap
- [ ] Design architecture diagram for the slide deck

---

### DAY 7 — Friday, September 4 (Final Polish + Practice)

#### Morning
- [ ] Final bug fixes from yesterday's testing
- [ ] Mobile: final UI polish (spacing, colors, typography consistency)
- [ ] Web: final polish
- [ ] Backend: add health check with dependency status (DB, Cloudinary, AI APIs)
- [ ] Update README.md with final project documentation

#### Afternoon
- [ ] **Practice demo presentation 3 times** with timer
- [ ] Test on actual demo hardware (phone, laptop, projector if available)
- [ ] Prepare judge Q&A answers:
  - "How does your AI detect defects?" → Gemini Vision + RAG context
  - "What about offline scenarios?" → SQLite queue + auto-sync
  - "How do you handle multi-tenant?" → Company/inspector RBAC + tenant scoping
  - "What's your business model?" → SaaS subscription for inspection agencies
- [ ] Record final backup video demo (high quality)
- [ ] Clean up code: remove debug logs, add final comments, ensure clean git history

#### Evening
- [ ] Pack demo kit: charged phone, laptop, charger, HDMI adapter
- [ ] Final check: all services running, demo data seeded, video backup ready
- [ ] **Sleep early** 😴

---

## 5. Bonus / Standout Features (Ranked by Impact)

### Tier 1 — High Impact (Build These)

| # | Feature | Why It Stands Out | Effort |
|---|---|---|---|
| 1 | **QR Code Report Verification** | Judges can scan a QR on the printed PDF → opens a public verification page showing "Verified by DefectLoupe". Physical + digital bridge = wow factor | 2 hours |
| 2 | **Offline Inspection Mode** | Inspector goes to a basement with no signal → takes photos, records notes → comes back online → everything auto-syncs. Real-world problem solved | 6 hours |
| 3 | **Multi-Language Reports** | Generate the same inspection report in English, Spanish, Urdu. Huge for international markets. One-click toggle | 3 hours |
| 4 | **AI Defect Severity Heatmap** | Visual heatmap overlay on the property floor plan showing where defects are concentrated. Even without a real floor plan, show a grid/area map with severity colors | 4 hours |
| 5 | **Live Voice-Guided Inspection** | The app speaks to the inspector: "Move to Kitchen area. Check under the sink for water damage." Like a GPS but for inspections | 3 hours |

### Tier 2 — Medium Impact (If Time Permits)

| # | Feature | Why It Stands Out | Effort |
|---|---|---|---|
| 6 | **Client Portal Preview Link** | Inspector shares a read-only link with the client to view the report online (no login needed for client). Professional touch | 3 hours |
| 7 | **Before/After Photo Comparison** | For re-inspections: side-by-side slider showing previous visit vs. current visit photos of the same area | 2 hours |
| 8 | **Voice Commands Mode** | "Next area", "Take photo", "Record note", "Skip" — hands-free operation while inspector is on a ladder or in a crawl space | 4 hours |
| 9 | **Smart Area Template Suggestions** | AI suggests inspection areas based on property type: "This is a 2010 residential home — recommended areas: Roof, Foundation, HVAC, Electrical Panel" | 2 hours |
| 10 | **Real-Time Inspector Collaboration** | Two inspectors on the same property — one does exterior, one does interior. See each other's progress live | 6 hours |

### Tier 3 — Quick Wins (1 Hour Each)

| # | Feature | Effort |
|---|---|---|
| 11 | Inspection photo watermark (timestamp + GPS + inspector name) | 1 hour |
| 12 | Dark mode on mobile app | 1 hour |
| 13 | Push notifications (report ready, transcription complete) | 1.5 hours |
| 14 | Export inspection data as CSV/Excel | 1 hour |
| 15 | Company logo + branding on PDF reports | 1 hour |
| 16 | Inspection completion certificate (auto-generated) | 1 hour |
| 17 | Voice note waveform visualization in the app | 1 hour |
| 18 | Auto-generate property description from photos | 1 hour |

---

## 6. API Contract Summary (All Endpoints)

### Existing (Already Built)
```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
GET    /auth/me
GET    /auth/verify-email?token=...
POST   /auth/resend-verification
GET    /inspectors/me
POST   /inspectors/company
GET    /inspectors/company
POST   /inspectors/company/inspectors
GET    /inspectors/company/inspectors
```

### To Build — Member 2 (Core Business)
```
GET    /api/v1/clients                          # list (tenant-scoped)
POST   /api/v1/clients                          # create
GET    /api/v1/clients/{id}                     # detail
PATCH  /api/v1/clients/{id}                     # update
DELETE /api/v1/clients/{id}                     # delete

GET    /api/v1/properties                       # list (tenant-scoped)
POST   /api/v1/properties                       # create
GET    /api/v1/properties/{id}                  # detail
PATCH  /api/v1/properties/{id}                  # update
DELETE /api/v1/properties/{id}                  # delete
GET    /api/v1/clients/{id}/properties          # client's properties

GET    /api/v1/inspections                      # list + filters
POST   /api/v1/inspections                      # create
GET    /api/v1/inspections/{id}                 # detail
PATCH  /api/v1/inspections/{id}                 # update status
GET    /api/v1/inspections/{id}/full-context     # aggregated (for reports + mobile)
GET    /api/v1/dashboard/stats                  # dashboard numbers

POST   /api/v1/inspections/{id}/areas           # add area
GET    /api/v1/inspections/{id}/areas            # list areas
PUT    /api/v1/inspections/{id}/areas/reorder    # reorder
DELETE /api/v1/areas/{id}                        # remove area
```

### To Build — Member 3 (Media + STT)
```
POST   /api/v1/areas/{id}/photos                # upload photo (multipart)
GET    /api/v1/areas/{id}/photos                 # list photos
DELETE /api/v1/photos/{id}                       # delete photo
GET    /api/v1/photos/{id}/download              # proxy download from Cloudinary

POST   /api/v1/areas/{id}/observations           # create text observation
POST   /api/v1/photos/{id}/observations           # create observation on photo
POST   /api/v1/observations                      # create voice observation (multipart audio)
GET    /api/v1/areas/{id}/observations            # list observations
GET    /api/v1/inspections/{id}/media             # all media grouped by area

POST   /api/v1/observations/{id}/transcribe       # trigger STT
GET    /api/v1/transcriptions/{id}                # get transcription
PATCH  /api/v1/transcriptions/{id}                # manual correction
GET    /api/v1/transcriptions/{id}/status          # processing status
```

### To Build — Member 4 (AI + Reports)
```
POST   /api/v1/rag/documents/upload             # ingest document (PDF/TXT/MD)
POST   /api/v1/rag/search                        # vector similarity search
GET    /api/v1/rag/documents                      # list ingested documents
DELETE /api/v1/rag/documents/{id}                 # remove document

POST   /api/v1/photos/{id}/analyze               # vision AI defect detection
GET    /api/v1/photos/{id}/analysis               # get defect labels + severity

POST   /api/v1/inspections/{id}/generate-report  # trigger report generation
GET    /api/v1/inspections/{id}/report/status     # check job status
GET    /api/v1/inspections/{id}/report/pdf        # download PDF
GET    /api/v1/inspections/{id}/report/json        # structured report data

GET    /api/v1/reports/{id}/verify               # public QR verification page
```

---

## 7. Demo Script (5–7 Minutes)

1. **(0:00) Problem** — "Property inspections today are pen-and-paper. Reports take days. Photos get lost."
2. **(0:30) Login** — Open DefectLoupe app, login as "Ali, Solo Inspector"
3. **(0:45) Dashboard** — Show past inspections, stats
4. **(1:00) New Inspection** — Create for client "Ahmed Khan, DHA Villa"
5. **(1:30) Area Setup** — Add areas from template: Roof, Kitchen, Bathroom, Electrical
6. **(2:00) Photo Capture** — Walk to Kitchen area, take photo of a crack, photo uploads instantly
7. **(2:30) Voice Note** — Record: "2-meter hairline crack on east wall, minor water seepage visible"
8. **(3:00) Auto-Transcription** — Show transcription appearing in real-time
9. **(3:30) AI Analysis** — Tap "Analyze Defects" → AI labels crack, severity: Medium, suggests repair
10. **(4:00) Generate Report** — Tap "Generate Report" → loading spinner → professional PDF opens
11. **(4:30) Report Showcase** — Scroll through: branded header, executive summary, severity matrix, photos with annotations, recommendations with cost estimates
12. **(5:00) QR Verification** — Show QR on PDF → scan → public verification page
13. **(5:30) Offline Mode** — Disable WiFi → take another photo → re-enable → auto-sync notification
14. **(6:00) Web Dashboard** — Quick switch to laptop → show same data on web dashboard
15. **(6:30) Closing** — "From crack detection to client-ready report in under 5 minutes. DefectLoupe."

---

## 8. Risk Mitigation

| Risk | Mitigation |
|---|---|
| Live demo crash | Record full backup video on Sep 3 |
| AI API rate limit / downtime | Cache last successful vision/RAG response; have pre-generated report ready |
| R2 upload fails | Local file storage fallback in `services/media/app/utils/storage.py` |
| Expo build fails on device | Test on real device daily starting Aug 31 |
| Merge conflicts | Strict service ownership (one member per service dir), merge to develop daily |
| Whisper STT too slow | Use faster-whisper locally (CPU mode) with small model |
| Database migration issues | Use `Base.metadata.create_all()` for hackathon (skip Alembic if blocking) |
| Team member unavailable | Each member documents their API contracts in shared doc before starting |
| **Microservice fails to start** | `docker compose ps` + `docker compose logs <service>` to isolate. Each service has its own healthcheck; failing one doesn't bring others down |
| **Traefik routing misconfiguration** | Keep Traefik dashboard open at `localhost:8080` during dev. Test each service via `docker compose logs <service>` or curl through Traefik at `:80` |
| **Cross-service HTTP calls fail** | Use Docker internal DNS (`http://core:8000`, `http://media:8000`) for inter-service calls. Wrap in try/except with fallback to cached/stale data |
| **Redis/Celery worker dies** | Redis restarts fast; Celery workers auto-reconnect. Use `docker compose up -d --scale celery-worker=2` for redundancy |
| **Container port conflicts on host** | Only expose ports for gateway (80), DB (5433), Redis (6379). Internal services stay on Docker network (no host port binding) |
| **Service image rebuild takes too long** | Use Docker layer caching: keep `requirements.txt` separate from code, install deps first, then COPY code. Add `--cache-from` for faster builds |
| **Shared DB schema conflicts** | Each service owns its own tables. Cross-service reads via direct SQL (same DB) — no migrations collide since tables don't overlap |
| **Docker Compose OOM on laptop** | ai-service (sentence-transformers + torch) is heavy. Use CPU-only torch build, or run ai-service on Colab/free tier GPU via ngrok if needed |

---

## 9. Definition of Done (MVP by Sep 1)

### Functional
- [ ] Inspector can register, verify email, login (existing ✅)
- [ ] Individual inspector can create/manage clients
- [ ] Inspector can create/manage properties per client
- [ ] Inspector can create inspection, add areas, reorder areas
- [ ] Inspector can take photos per area (uploaded to R2)
- [ ] Inspector can record voice notes (uploaded to R2)
- [ ] Voice notes auto-transcribe via Whisper
- [ ] Inspector can trigger AI report generation
- [ ] PDF report downloads with photos, severity matrix, recommendations
- [ ] Mobile app runs full end-to-end flow on a real phone
- [ ] Web dashboard shows inspection list and report viewer
- [ ] All endpoints authenticated + tenant-scoped
- [ ] Demo database seeded with realistic sample data

### Microservices & Infrastructure
- [ ] `docker compose up --build` launches all 8 containers (gateway, auth, core, media, ai, celery-worker, db, redis) in one command
- [ ] All external traffic flows through Traefik at `localhost:80` (no direct port access to services)
- [ ] Each service has its own Dockerfile + `requirements.txt` and builds independently
- [ ] Each service passes its own healthcheck (Traefik auto-removes unhealthy backends)
- [ ] Async jobs (STT, report generation) run via Celery workers, not in-process
- [ ] Redis is reachable from all services and the Celery broker
- [ ] Inter-service calls use Docker internal DNS (`http://core:8000`, etc.) — not `localhost`
- [ ] Scaling test passes: `docker compose up -d --scale celery-worker=2` runs two parallel workers
- [ ] Any single service can crash without taking down the rest (verified by `docker compose stop ai` while auth+core+media still respond)
- [ ] `docker compose down` cleanly stops everything; `docker compose up -d` recovers with data intact (PostgreSQL volume persisted)
