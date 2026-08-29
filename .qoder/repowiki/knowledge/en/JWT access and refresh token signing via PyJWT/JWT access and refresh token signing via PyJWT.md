---
kind: external_dependency
name: JWT access and refresh token signing via PyJWT
slug: pyjwt
category: external_dependency
category_hints:
    - sdk_real_api
    - auth_protocol
scope:
    - '**'
---

Access and refresh tokens are signed using PyJWT. Secrets and expiry durations are read from `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRY` environment variables. Tokens are issued as HTTP-only secure cookies; refresh tokens are persisted to the database and rotated on each `/auth/refresh` call, with theft detection revoking all sessions when a reused refresh token is detected.