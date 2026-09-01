"""Celery application factory for ai-service async workers.

Usage:
    celery -A app.workers.celery_app worker -l info
"""
import os

from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "ai_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
)

# Auto-discover tasks in workers package
celery_app.autodiscover_tasks(["app.workers"])
