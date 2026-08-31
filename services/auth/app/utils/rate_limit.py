import os

from slowapi import Limiter
from slowapi.util import get_remote_address


limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.getenv("REDIS_URL", "redis://redis:6379/0"),
)
