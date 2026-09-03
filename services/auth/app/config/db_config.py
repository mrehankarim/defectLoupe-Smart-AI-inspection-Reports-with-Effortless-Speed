"""Compatibility import for the shared database session."""
from shared.db_config import engine, get_db, SessionLocal

__all__ = ["engine", "get_db", "SessionLocal"]
