---
kind: configuration_system
name: dotenv-based Environment Configuration with Docker Compose Secrets
category: configuration_system
scope:
    - '**'
source_files:
    - app/config/db_config.py
    - app/utils/config_loader.py
    - app/.env.example
    - docker-compose.yaml
    - Dockerfile
    - app/main.py
---

## What system/approach is used

The application uses a simple **`.env` file + `python-dotenv`** configuration approach. There is no centralized configuration framework (e.g., Pydantic Settings, dynaconf, or a config service). Configuration values are read directly from environment variables via `os.getenv`, loaded by calling `load_dotenv()` at module import time.

Docker Compose and the Dockerfile provide the runtime environment: secrets and connection strings are injected as environment variables into the backend container, while the `.env.example` file documents the expected keys for local development.

## Key files and packages

- `app/config/db_config.py` — Loads `.env`, reads `DATABASE_URL`, creates the SQLAlchemy engine and session factory, and exposes a `get_db()` dependency-injection generator.
- `app/utils/config_loader.py` — Central loader that calls `load_dotenv()` once, then provides typed getter functions for JWT secrets and expiry settings (`get_access_token_secret`, `get_refresh_token_secret`, `get_access_token_expiry_seconds`, `get_refresh_token_expiry_seconds`). Includes a helper `_parse_expiry_to_seconds` that parses human-readable durations like `15m`, `10d`, `3600s`.
- `app/.env.example` — Documents all required environment variables: `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRY`.
- `docker-compose.yaml` — Defines the `db` (Postgres with pgvector) and `backend` services; injects `DATABASE_URL`, token secrets, and expiry values as environment variables into the backend container.
- `Dockerfile` — Builds a Python 3.11-slim image, installs dependencies, copies source, and runs `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
- `app/main.py` — Application entrypoint; imports `engine` from `db_config` (which triggers `.env` loading), creates tables at startup via `Base.metadata.create_all`, and includes routers.

## Architecture and conventions

1. **Single `.env` per project root**: Both `db_config.py` and `config_loader.py` resolve the `.env` path relative to their own location under `app/`, pointing to `app/.env`. This means the `.env` file lives next to the Python package, not at the repository root.
2. **Eager loading on import**: `load_dotenv()` is called at module import time in both `db_config.py` and `config_loader.py`. The first import of either module loads the environment; subsequent imports are no-ops for dotenv but still safe.
3. **Fail-fast on missing secrets**: Every required secret is validated immediately upon access. If `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, or `REFRESH_TOKEN_SECRET` is absent, a `RuntimeError` is raised with a descriptive message indicating the expected source (e.g., the `.env` path).
4. **Typed getters over raw `os.getenv`**: Sensitive or parsed values are accessed through dedicated functions in `config_loader.py` rather than scattered `os.getenv` calls across the codebase. This centralizes parsing logic (e.g., expiry string → seconds) and validation.
5. **Default expiry values**: `ACCESS_TOKEN_EXPIRY` defaults to `15m` and `REFRESH_TOKEN_EXPIRY` defaults to `10d` when not set, so the app can run without explicit expiry configuration.
6. **Docker-first deployment**: Production-like configuration is provided via `docker-compose.yaml`, which sets all required env vars inline. The `.env.example` file mirrors these keys for local development, with comments distinguishing Docker vs. host database URLs.
7. **Database schema bootstrap**: On FastAPI lifespan start, `Base.metadata.create_all(bind=engine)` ensures tables exist before serving requests.

## Conventions and constraints

- **Required environment variables**: `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` must be present at runtime; absence raises `RuntimeError` during import/use.
- **Expiry format**: Token expiry values must be strings ending in one of `m` (minutes), `h` (hours), `d` (days), or `s` (seconds); unknown units raise `ValueError`.
- **Secrets are not versioned**: Only `.env.example` is committed; actual `.env` values are expected to be kept out of version control (implied by the example template pattern).
- **Local vs. Docker DB URL**: The `.env.example` documents two `DATABASE_URL` variants — one using the Docker network hostname `db` for compose, and one using `localhost:5433` for direct host access — guiding developers to pick the correct value per environment.
- **Container networking**: The backend container connects to Postgres using the Docker Compose service name `db` on port `5432`; the host-facing port `5433` is only for external tooling.