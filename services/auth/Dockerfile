# Shared Dockerfile for DefectLoupe microservices.
#
# Build context MUST be the repo root (so we can COPY the `shared/` package).
# Each service in docker-compose.yaml passes its own name via SERVICE_NAME arg.
#
# Usage (from repo root):
#   docker build --build-arg SERVICE_NAME=auth -f services/auth/Dockerfile -t defectloupe-auth .

ARG PYTHON_VERSION=3.11
FROM python:${PYTHON_VERSION}-slim

ARG SERVICE_NAME=auth
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    SERVICE_NAME=${SERVICE_NAME}

WORKDIR /app

# Install system deps only for services that need them (WeasyPrint, Pillow)
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY services/${SERVICE_NAME}/requirements.txt ./requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy service code + shared package
COPY services/${SERVICE_NAME}/app ./app
COPY shared ./shared

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
