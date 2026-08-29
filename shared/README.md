# shared

Cross-cutting Python package used by all DefectLoupe microservices.

## Modules

- `db_config.py` — SQLAlchemy engine + sessionmaker
- `base.py` — SQLAlchemy `DeclarativeBase` used by all models
- `password.py` — argon2 hashing helpers
- `auth_deps.py` — FastAPI dependencies (`get_current_user`, `get_current_inspector`)

## Why a shared package?

Each service needs to:
1. Connect to the same PostgreSQL DB.
2. Decode the same JWT (same secret, same algorithm).
3. Use the same base model class for ORM relationships.

Instead of duplicating these 4 files in every service, they live here and are
COPY'd into each Docker image at build time (see `services/*/Dockerfile`).

## Rules

- **Read-mostly** — discuss changes with the team.
- **No business logic** — only infrastructure / cross-cutting concerns.
- **Stable API** — if you change a function signature, notify all members.
