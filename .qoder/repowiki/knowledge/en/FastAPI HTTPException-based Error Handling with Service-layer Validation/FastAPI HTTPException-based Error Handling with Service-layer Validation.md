---
kind: error_handling
name: FastAPI HTTPException-based Error Handling with Service-layer Validation
category: error_handling
scope:
    - '**'
source_files:
    - app/services/auth_service.py
    - app/api/routes/inspector_routes.py
    - app/config/db_config.py
    - app/main.py
---

## What system/approach is used

The DefectLoupe backend uses **FastAPI's built-in `HTTPException`** as the sole application-level error signaling mechanism. There are no custom exception classes, no centralized error response models, and no global exception handlers registered in `app/main.py`. Errors are raised directly from service functions and route handlers using `fastapi.HTTPException` paired with `fastapi.status` constants (e.g. `HTTP_401_UNAUTHORIZED`, `HTTP_403_FORBIDDEN`, `HTTP_404_NOT_FOUND`, `HTTP_409_CONFLICT`). FastAPI automatically converts these into JSON responses with a `detail` field.

Configuration errors use plain Python exceptions: `db_config.py` raises `RuntimeError` when `DATABASE_URL` is missing at import time, which is appropriate for startup-time misconfiguration.

There is no `try/except`-based error wrapping around database calls; SQLAlchemy operations are invoked directly and any underlying DB exceptions would propagate as unhandled server errors.

## Key files and packages

- `app/services/auth_service.py` — primary location of business-logic error signaling. Every auth failure (invalid credentials, deactivated account, missing token, expired/invalid refresh token, token reuse detection) raises `HTTPException` with an explicit status code and human-readable `detail` string. Also defines FastAPI `Depends` (`get_current_user`, `get_current_inspector`, `require_company_owner`) that enforce authentication/authorization by raising `HTTPException` before reaching route handlers.
- `app/api/routes/inspector_routes.py` — route handlers raise `HTTPException` for authorization checks (company membership, owner-only actions). Note that `HTTPException` and `status` are imported locally inside each function rather than at module top, likely to avoid circular imports.
- `app/config/db_config.py` — raises `RuntimeError` on missing `DATABASE_URL`; otherwise returns a session via a generator context manager that always closes the DB session in a `finally` block.
- `app/main.py` — no custom exception handlers or middleware; relies entirely on FastAPI's default error handling.

## Architecture and conventions

1. **Service layer owns validation and error signaling.** Route handlers delegate to service functions (`auth_service`, `inspector_service`) and let them raise `HTTPException`. Routes themselves only perform minimal pre-checks (e.g. company association) before calling services.
2. **Authentication/Authorization as dependencies.** `get_current_user`, `get_current_inspector`, and `require_company_owner` are declared as `Depends(...)` and raise `HTTPException` when preconditions fail. This centralizes authN/Z logic and keeps routes clean.
3. **Status-code granularity.** The codebase distinguishes between:
   - `401 UNAUTHORIZED` — missing/invalid/expired tokens, invalid credentials, not authenticated.
   - `403 FORBIDDEN` — deactivated accounts, not a company member, not the company owner.
   - `404 NOT_FOUND` — inspector profile not found, not associated with any company.
   - `409 CONFLICT` — email already registered.
4. **Token rotation safety.** In `refresh_tokens`, if token reuse is detected (possible theft), the stored refresh token is cleared and cookies are wiped before raising `401` — defensive cleanup precedes the error response.
5. **No global error handler.** There is no `@app.exception_handler` or middleware to normalize error responses. Clients receive FastAPI's default `{"detail": "..."}` JSON shape.
6. **Startup vs runtime errors.** Configuration failures raise `RuntimeError` at import time (fail-fast); runtime business errors raise `HTTPException`.

## Conventions and constraints

- All user-facing errors go through `HTTPException(status_code=..., detail="...")` — no ad-hoc return codes or custom response objects for errors.
- Auth-related errors consistently use `clear_auth_cookies(response)` before raising `401` to ensure stale cookies are removed on token failure.
- Database sessions are always closed via the `get_db()` generator's `finally` block; there are no manual `session.close()` calls scattered elsewhere.
- No `try/except Exception` blocks exist outside of JWT decode paths in `auth_service.py`, where a bare `except Exception:` catches decode failures and translates them into `401` responses.
- No custom domain-specific exception types (e.g. `InspectionNotFoundError`, `ValidationError`) are defined; all domain errors are expressed as `HTTPException` with descriptive `detail` strings.