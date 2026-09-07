# Shared Dockerfile — see services/auth/Dockerfile for details.
# Build with: docker build --build-arg SERVICE_NAME=ai -f services/ai/Dockerfile -t defectloupe-ai .
ARG PYTHON_VERSION=3.11
FROM python:${PYTHON_VERSION}-slim

ARG SERVICE_NAME=ai
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    SERVICE_NAME=${SERVICE_NAME}

WORKDIR /app

# WeasyPrint needs pango/cairo; Pillow needs libjpeg/zlib
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libgdk-pixbuf-2.0-0 \
        libffi-dev \
        libjpeg-dev \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY services/${SERVICE_NAME}/requirements.txt ./requirements.txt
RUN pip install --upgrade pip && pip install torch --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt

COPY services/${SERVICE_NAME}/app ./app
COPY services/${SERVICE_NAME}/templates ./templates
COPY shared ./shared

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
