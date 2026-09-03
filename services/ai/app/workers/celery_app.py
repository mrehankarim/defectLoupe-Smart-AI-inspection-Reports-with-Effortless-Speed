"""Celery application used by the compose worker service."""
import os
from celery import Celery
celery_app = Celery("defectloupe-ai", broker=os.getenv("REDIS_URL", "redis://redis:6379/0"), backend=os.getenv("REDIS_URL", "redis://redis:6379/0"))
celery_app.conf.task_default_queue = "default"
