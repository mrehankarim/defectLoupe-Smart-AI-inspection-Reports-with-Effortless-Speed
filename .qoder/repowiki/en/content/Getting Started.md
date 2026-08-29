# Getting Started

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [requirements.txt](file://requirements.txt)
- [docker-compose.yaml](file://docker-compose.yaml)
- [Dockerfile](file://Dockerfile)
- [app/main.py](file://app/main.py)
- [app/config/db_config.py](file://app/config/db_config.py)
- [app/utils/config_loader.py](file://app/utils/config_loader.py)
- [app/api/routes/auth_routes.py](file://app/api/routes/auth_routes.py)
- [app/api/routes/inspector_routes.py](file://app/api/routes/inspector_routes.py)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
   - [Option A: Docker Compose (Recommended)](#option-a-docker-compose-recommended)
   - [Option B: Local Development with Python](#option-b-local-development-with-python)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Application Startup](#application-startup)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)
9. [Next Steps](#next-steps)

## Introduction
DefectLoupe Backend is a FastAPI-based service for property inspection and defect tracking. It provides authentication, inspector/company management, and supports rich media observations with voice transcription. The backend uses PostgreSQL with the pgvector extension and can be run via Docker Compose or locally with Python.

## Prerequisites
- Python 3.11+ (for local development)
- Docker Desktop (recommended for containerized execution)
- Git

These prerequisites are required to clone the repository, build/run containers, and install dependencies when running locally.

**Section sources**
- [README.md:66-80](file://README.md#L66-L80)

## Installation

### Option A: Docker Compose (Recommended)
This method starts both the PostgreSQL database and the FastAPI application together.

Steps:
1. Clone the repository and enter the project directory.
2. Create an environment file for the app:
   - Copy the example environment template into the app directory and edit it as needed.
3. Start all services:
   - Run the compose stack in detached mode.
4. Verify that the services are healthy and accessible.

Notes:
- The database container exposes port 5433 on your host machine.
- The backend container exposes port 8000 on your host machine.
- The compose stack waits for the database to be healthy before starting the backend.

**Section sources**
- [README.md:84-115](file://README.md#L84-L115)
- [docker-compose.yaml:1-48](file://docker-compose.yaml#L1-L48)
- [Dockerfile:1-13](file://Dockerfile#L1-L13)

### Option B: Local Development with Python
Use this option if you prefer to run the API directly on your machine while using Docker only for the database.

Steps:
1. Create and activate a virtual environment appropriate for your OS.
2. Install dependencies from requirements.
3. Start the PostgreSQL database container (if not already running).
4. Configure environment variables for the app (see Environment Configuration).
5. Start the FastAPI server with auto-reload enabled.

Notes:
- When running locally, ensure DATABASE_URL points to localhost:5433 where the database container is exposed.
- Use uvicorn with reload for a smoother developer experience.

**Section sources**
- [README.md:119-149](file://README.md#L119-L149)
- [requirements.txt:1-11](file://requirements.txt#L1-L11)
- [docker-compose.yaml:1-21](file://docker-compose.yaml#L1-L21)

## Environment Configuration
The application reads configuration from environment variables. For Docker Compose, these are set in the compose file. For local development, create an .env file inside the app directory.

Key variables:
- DATABASE_URL: PostgreSQL connection string
  - Docker Compose example target: postgresql://postgres:postgres@db:5432/defect-loupe
  - Local example target: postgresql://postgres:postgres@localhost:5433/defect-loupe
- ACCESS_TOKEN_SECRET: Secret used to sign access tokens
- ACCESS_TOKEN_EXPIRY: Access token lifespan (e.g., 15m)
- REFRESH_TOKEN_SECRET: Secret used to sign refresh tokens
- REFRESH_TOKEN_EXPIRY: Refresh token lifespan (e.g., 10d)

Where they are loaded:
- Database URL is read by the database configuration module at startup.
- Token secrets and expiry values are read by the configuration loader utilities.

Important:
- Ensure DATABASE_URL is set; otherwise, the application will raise an error at startup.
- For local runs, point DATABASE_URL to the host port 5433 where the database container listens.

**Section sources**
- [README.md:170-179](file://README.md#L170-L179)
- [docker-compose.yaml:33-38](file://docker-compose.yaml#L33-L38)
- [app/config/db_config.py:1-18](file://app/config/db_config.py#L1-L18)
- [app/utils/config_loader.py:1-44](file://app/utils/config_loader.py#L1-L44)

## Database Setup
The PostgreSQL database is provided by the docker-compose stack using the pgvector image. It initializes with default credentials and database name.

Defaults:
- Host: localhost (from your machine)
- Port: 5433 (mapped from container’s 5432)
- User: postgres
- Password: postgres
- Database: defect-loupe

You can connect using any database GUI tool (TablePlus, DBeaver, pgAdmin) with the above settings.

Schema initialization:
- On application startup, the FastAPI lifespan creates all tables defined in the ORM models.

**Section sources**
- [README.md:153-167](file://README.md#L153-L167)
- [docker-compose.yaml:2-21](file://docker-compose.yaml#L2-L21)
- [app/main.py:11-18](file://app/main.py#L11-L18)

## Application Startup
FastAPI is configured to:
- Create database tables on startup via the lifespan hook.
- Include authentication and inspector route modules.
- Expose a root endpoint for health checks.

When running via Docker Compose:
- The backend service depends on the database being healthy before starting.
- The server listens on port 8000 inside the container and is mapped to port 8000 on your host.

When running locally:
- Start uvicorn pointing to the FastAPI app module with reload enabled for development.

**Section sources**
- [docker-compose.yaml:22-40](file://docker-compose.yaml#L22-L40)
- [app/main.py:11-30](file://app/main.py#L11-L30)

## Verification
After starting the application, verify that everything is working:

- Health check:
  - Open http://localhost:8000/ in your browser or use curl to confirm the backend responds.
- Interactive API documentation:
  - Open http://localhost:8000/docs to view Swagger UI.
  - Open http://localhost:8000/redoc for ReDoc documentation.
- Authentication endpoints:
  - POST /auth/register to create a user
  - POST /auth/login to obtain tokens
  - GET /auth/me to retrieve current user info
- Inspector endpoints:
  - GET /inspectors/me to get profile and ownership status
  - POST /inspectors/company to create a company (owner-only workflow)
  - GET /inspectors/company to fetch associated company
  - POST /inspectors/company/inspectors to add inspectors (owner-only)
  - GET /inspectors/company/inspectors to list inspectors

If these endpoints respond successfully, your installation is correct.

**Section sources**
- [README.md:107-110](file://README.md#L107-L110)
- [app/api/routes/auth_routes.py:22-65](file://app/api/routes/auth_routes.py#L22-L65)
- [app/api/routes/inspector_routes.py:23-143](file://app/api/routes/inspector_routes.py#L23-L143)

## Troubleshooting
Common issues and resolutions:

- Missing DATABASE_URL:
  - Symptom: Application fails to start with a runtime error indicating DATABASE_URL is not set.
  - Resolution: Set DATABASE_URL in your environment (.env for local, or compose environment for Docker).

- Database not ready:
  - Symptom: Backend cannot connect to the database on startup.
  - Resolution: Ensure the database container is running and healthy. In Docker Compose, the backend waits for the db service to be healthy before starting.

- Port conflicts:
  - Symptom: Cannot bind to port 8000 or 5433.
  - Resolution: Stop other processes using those ports or change mappings in docker-compose.yaml and DATABASE_URL accordingly.

- Local vs container connectivity:
  - Symptom: Connection errors when running locally.
  - Resolution: Use localhost:5433 in DATABASE_URL when connecting to the database container from your host.

- CORS or network issues:
  - Symptom: Frontend cannot reach the API.
  - Resolution: Confirm the API is reachable at http://localhost:8000 and adjust frontend base URLs or proxy settings as needed.

**Section sources**
- [app/config/db_config.py:11-18](file://app/config/db_config.py#L11-L18)
- [docker-compose.yaml:16-21](file://docker-compose.yaml#L16-L21)
- [docker-compose.yaml:28-32](file://docker-compose.yaml#L28-L32)

## Next Steps
- Explore the interactive API docs at http://localhost:8000/docs to test endpoints.
- Create a user and log in to obtain tokens.
- Create a company and add inspectors to simulate multi-inspector workflows.
- Extend the application with additional features such as inspections, areas, photos, and observations as per the data model.

[No sources needed since this section provides general guidance]