---
kind: dependency_management
name: Python Dependencies via requirements.txt with Dockerized Install
category: dependency_management
scope:
    - '**'
source_files:
    - requirements.txt
    - Dockerfile
---

## What system/approach is used

This repository manages Python dependencies using a single flat `requirements.txt` file at the project root and installs them via `pip` inside a Docker image based on `python:3.11-slim`. There is no lockfile (no `requirements.lock`, `Pipfile.lock`, `poetry.lock`, or `uv.lock`) — dependency versions are pinned only by minimum version specifiers (`>=`) in `requirements.txt`, except for `PyJWT` which has no version pin at all.

The `.venv/` directory exists but appears empty; it is not committed as part of the build pipeline. The Dockerfile does not use a virtual environment — it runs `pip install --no-cache-dir -r requirements.txt` directly in the container image, so runtime isolation comes from the container rather than a per-project venv.

## Key files and packages

- `requirements.txt` — sole source of truth for third-party dependencies. Declares FastAPI, Uvicorn, SQLAlchemy + pgvector, psycopg2-binary, Alembic, Pydantic v2, python-dotenv, PyJWT, pwdlib[argon2], and email-validator.
- `Dockerfile` — defines the runtime image (`python:3.11-slim`), copies `requirements.txt` first to leverage Docker layer caching, runs `pip install`, then copies application code and launches `uvicorn app.main:app` on port 8000.
- `docker-compose.yaml` (referenced in root tree) — likely orchestrates the service alongside its database, but dependency installation itself happens inside the image built by the Dockerfile.

## Architecture and conventions

- **Single manifest**: All dependencies are declared in one `requirements.txt`; there is no subpackage-level dependency declaration.
- **Minimum-version pins**: Most packages use `>=X.Y.Z` constraints rather than exact pins, allowing minor/patch updates through pip resolution.
- **Container-first install**: The production image installs dependencies at build time with `--no-cache-dir` to keep images small; development may use a local `.venv` but it is not tracked in version control.
- **No vendoring**: No vendored third-party code under `vendor/` or similar directories; all packages are fetched from PyPI at install/build time.
- **No private registry configuration**: There is no `pip.conf`, `~/.netrc`, `PYPI_URL`, or `--index-url` flags visible in the Dockerfile or elsewhere, indicating reliance on the default public PyPI index.

## Conventions and constraints

- **Constraint style**: Dependencies are expressed as `package>=version` (e.g., `fastapi>=0.115.0`, `sqlalchemy>=2.0.0`); this is an observed convention in `requirements.txt`.
- **Optional extras**: One dependency uses an optional extra (`pwdlib[argon2]`), showing that extras are supported when needed.
- **Build reproducibility gap**: Because no lockfile is generated and most pins are lower bounds, builds are not fully reproducible across environments without additional tooling — this is a de facto constraint of the current setup.
- **Runtime entrypoint**: The Dockerfile pins the runtime Python image to `python:3.11-slim`, which constrains the compatible Python version range for all listed dependencies.