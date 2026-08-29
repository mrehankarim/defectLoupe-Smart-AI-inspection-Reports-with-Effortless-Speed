# Shared infrastructure package for DefectLoupe microservices.
#
# This folder contains cross-cutting concerns used by multiple services:
#   - db_config.py      → SQLAlchemy engine + sessionmaker
#   - base.py           → SQLAlchemy DeclarativeBase (used by all models)
#   - password.py       → argon2 hashing helpers
#   - auth_deps.py      → FastAPI dependencies (get_current_user, get_current_inspector)
#
# Each service COPYs this folder into its image at /app/shared/ during Docker build,
# so it behaves like a local package (import shared.db_config, etc.).
#
# Ownership: everyone — treat this as a read-mostly library. Changes here ripple
# across all services, so discuss with the team before editing.
