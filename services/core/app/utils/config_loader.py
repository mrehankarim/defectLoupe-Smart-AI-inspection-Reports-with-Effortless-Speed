"""Environment configuration loader for core-service."""
import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_PATH)


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set")
    return url


def get_access_token_secret() -> str:
    secret = os.getenv("ACCESS_TOKEN_SECRET")
    if not secret:
        raise RuntimeError("ACCESS_TOKEN_SECRET is not set")
    return secret
