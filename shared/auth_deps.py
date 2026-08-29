"""Shared FastAPI dependencies used by every service that needs JWT auth.

Each service installs this via COPY in its Dockerfile, then does:

    from shared.auth_deps import get_current_user, get_current_inspector

This decodes the JWT locally using the same ACCESS_TOKEN_SECRET — no
cross-service HTTP call is needed for authentication.
"""
