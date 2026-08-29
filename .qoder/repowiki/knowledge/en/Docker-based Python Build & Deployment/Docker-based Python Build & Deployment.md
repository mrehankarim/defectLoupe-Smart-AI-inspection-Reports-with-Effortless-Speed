---
kind: build_system
name: Docker-based Python Build & Deployment
category: build_system
scope:
    - '**'
source_files:
    - Dockerfile
    - docker-compose.yaml
    - requirements.txt
    - .dockerignore
---

## Build System Overview

The DefectLoupe backend uses a minimal, Docker-centric build and deployment strategy with no Makefile, shell scripts, or CI pipeline configuration in the repository.

### Build Toolchain
- **Python packaging**: `requirements.txt` pins runtime dependencies (FastAPI, Uvicorn, SQLAlchemy, Alembic, PyJWT, pgvector, etc.) using `>=` version specifiers; there is no `pyproject.toml`, `setup.py`, or lock file.
- **Container image**: A single-stage `Dockerfile` based on `python:3.11-slim` installs dependencies via `pip install --no-cache-dir -r requirements.txt`, copies source code into `/app`, exposes port 8000, and runs the app through `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
- **Local orchestration**: `docker-compose.yaml` defines two services — a Postgres service (`ankane/pgvector:latest`) mapped to host port 5433 with a named volume `defect-loupe-data`, and the backend service built from the root `Dockerfile`. The backend depends on the database being healthy via a `pg_isready` healthcheck before starting.

### Environment & Secrets
- Database connection is passed as `DATABASE_URL=postgresql://postgres:postgres@db:5432/defect-loupe` in compose.
- JWT secrets (`ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`) and expiry settings are hardcoded directly in `docker-compose.yaml` environment variables rather than loaded from `.env` at compose time.
- The application itself reads config from `app/.env` via `python-dotenv` (see `utils/config_loader.py`), but this file is excluded from Docker builds by `.dockerignore`.

### Image Exclusions
`.dockerignore` excludes Python bytecode, virtual environments (`venv/`, `.venv/`, `env/`), cache directories (`.pytest_cache`, `htmlcov`, `.coverage`), IDE configs (`.vscode`, `.idea`), and Git metadata from the build context.

### Conventions Observed
- No multi-stage Docker build; the image contains both build-time pip installs and runtime source.
- No separate dev/prod images — the same Dockerfile is used for all environments.
- No CI/CD pipeline files (e.g., GitHub Actions, GitLab CI) are present in the repository.
- No Makefile or build scripts exist at the repository root.
- No release artifacts (wheel, sdist) are produced; deployment is container-only.
- Dependencies use minimum-version pinning (`>=X.Y.Z`) rather than exact pins or a lock file.
- The database image is pinned to `:latest` tag, which means it may change over time.