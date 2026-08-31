"""Re-export the shared SQLAlchemy Base so models can do:

    from app.repository.base import Base
"""
from shared.base import Base  # noqa: F401
