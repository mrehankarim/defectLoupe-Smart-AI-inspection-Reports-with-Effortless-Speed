"""Celery application factory for media-service async workers.

Usage:
    celery -A app.workers.celery_app worker -l info -Q stt
"""
from celery import Celery

from app.utils.config import REDIS_URL

celery_app = Celery(
    "media-service",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # Route STT tasks to the dedicated queue
    task_routes={
        "app.workers.transcribe_worker.*": {"queue": "stt"},
    },
)

# Auto-discover tasks in workers package
celery_app.autodiscover_tasks(["app.workers"])
