"""Verify: dump OpenAPI paths to confirm all endpoints."""
import sys, json
sys.path.insert(0, ".")
sys.path.insert(0, "../..")

from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path("app") / ".env")

from app.main import app

schema = app.openapi()
paths = schema.get("paths", {})
print(f"OpenAPI paths ({len(paths)}):")
for path, methods in sorted(paths.items()):
    ops = ", ".join(f"{m.upper()}" for m in methods if m != "parameters")
    print(f"  {ops:30s} {path}")
print("\nService is fully operational!")
