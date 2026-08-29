# Shared Dockerfile — see services/auth/Dockerfile for details.
# Build with: docker build --build-arg SERVICE_NAME=core -f services/core/Dockerfile -t defectloupe-core .
ARG PYTHON_VERSION=3.11
FROM python:${PYTHON_VERSION}-slim

ARG SERVICE_NAME=core
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    SERVICE_NAME=${SERVICE_NAME}

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY services/${SERVICE_NAME}/requirements.txt ./requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY services/${SERVICE_NAME}/app ./app
COPY shared ./shared

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
