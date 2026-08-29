---
kind: external_dependency
name: PostgreSQL 15 with pgvector extension
slug: postgresql-15
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

Relational datastore for DefectLoupe. The app uses SQLAlchemy 2.0 mapped models against a PostgreSQL 15 instance that must have the `pgvector` extension (`ankane/pgvector`) enabled for vector similarity search on inspection data. Docker Compose provisions the DB container; locally it is exposed on host port 5433 (container port 5432). Connection string is supplied via the `DATABASE_URL` environment variable.