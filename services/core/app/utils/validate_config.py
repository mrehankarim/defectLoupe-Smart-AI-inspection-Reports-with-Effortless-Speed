"""Validate that all required environment variables are set for core-service.

Run at startup or manually:
    python -m app.utils.validate_config
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

REQUIRED_VARS = [
    "DATABASE_URL",
    "ACCESS_TOKEN_SECRET",
]

OPTIONAL_VARS = [
    "ACCESS_TOKEN_EXPIRY",
    "CORS_ORIGINS",
]


def validate_config() -> bool:
    """Check that all required env vars are present."""
    ok = True
    for var in REQUIRED_VARS:
        value = os.getenv(var)
        if not value:
            print(f"[ERROR] Missing required env var: {var}")
            ok = False
        else:
            # Mask secrets
            display = value[:10] + "..." if len(value) > 15 else value
            print(f"[OK]    {var} = {display}")

    for var in OPTIONAL_VARS:
        value = os.getenv(var)
        if value:
            print(f"[OK]    {var} = {value}")
        else:
            print(f"[INFO]  {var} not set (optional)")

    return ok


if __name__ == "__main__":
    if not validate_config():
        print("\nConfiguration validation FAILED. Please set the missing variables.")
        sys.exit(1)
    print("\nConfiguration validation passed.")
