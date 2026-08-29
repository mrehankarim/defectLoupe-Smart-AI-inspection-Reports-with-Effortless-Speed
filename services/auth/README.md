# auth-service

Identity, JWT auth, email verification, and company/inspector membership.

## Scope

- **Tables owned:** `users`, `inspectors`, `companies`
- **Routes:** `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`,
  `/auth/verify-email`, `/auth/me`, `/auth/resend-verification`,
  `/inspectors/me`, `/inspectors/company`, `/inspectors/company/inspectors`
- **Owner:** M1 (Auth + Web Shell Lead)

## Run locally

```bash
cd services/auth
cp app/.env.example app/.env     # fill in real values
uvicorn app.main:app --reload --port 8001
```

## Docker build

```bash
docker build --build-arg SERVICE_NAME=auth -f services/auth/Dockerfile -t defectloupe-auth .
```

## Dependencies on other services

None (foundation layer).
