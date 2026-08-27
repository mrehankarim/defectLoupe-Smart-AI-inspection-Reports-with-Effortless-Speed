# DefectLoupe Backend

DefectLoupe is a modern property inspection and defect tracking backend platform. It enables independent inspectors and inspection agencies to conduct structured property walkthroughs, capture photos, record textual or voice notes, and generate detailed inspection records.

---

## Project Overview and Goals

During property inspections, inspectors need a fast, reliable, and hands-free way to document defects and conditions across various areas of a property (such as the kitchen, roof, basement, or foundation).

### Key Features and Goals

- **Multi-Tenant Flexibility**: Supports both individual solo inspectors and inspection agencies managing multiple inspectors and client accounts.
- **Hierarchical Inspection Flow**: Inspectors conduct inspections on specific client properties by breaking them down into ordered inspection areas.
- **Rich Media and Observations**: Inspectors can capture photos of defects and attach observations (either typed text or recorded voice audio).
- **Automated Voice Transcription**: Voice observations link directly to transcription records for speech-to-text processing.
- **Relational Data Integrity**: Built with SQLAlchemy 2.0 and PostgreSQL (pgvector enabled) with full two-way ORM relationships and cascade rules.

---

## Data Model Architecture

The core relational database entities are structured as follows:

```
[User] (1) <---> (0..1) [Inspector]
                           |
            +--------------+--------------+
            |                             |
            v                             v
       [Client]                      [Inspection]
            |                             |
            v                             v
       [Property] <-----------------------+
                                          |
                                          v
                                  [InspectionArea]
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v                                   v
                   [AreaPhoto] <--- (optional FK) --- [AreaObservation] (Text / Voice)
                                                            |
                                                            v
                                                     [Transcription]

[Company] (Agency) (1) <---> (N) [Inspector]  (Optional for solo inspectors)
[Company] (Agency) (1) <---> (N) [Client]     (Optional)
```

### Database Entities Summary

1. **User**: Authentication credentials, JWT tokens, and account status.
2. **Company**: Agency profile for multi-inspector organizations.
3. **Inspector**: Inspector profile (Solo Individual or Agency Member) linked to a User.
4. **Client**: Property owner or home buyer who requested the inspection.
5. **Property**: Physical property details, address, year built, and property type.
6. **Inspection**: Inspection job record linking an inspector, a property, scheduled date, and status.
7. **InspectionArea**: Specific room or section (e.g., Kitchen, Roof) with ordering.
8. **AreaPhoto**: High-resolution defect photo taken in an inspection area.
9. **AreaObservation**: Observation note (text or voice) attached to an area or specific photo.
10. **Transcription**: Speech-to-text output generated from voice observations.

---

## Tech Stack

- **Framework**: FastAPI (Python 3.11+)
- **ASGI Server**: Uvicorn
- **ORM**: SQLAlchemy 2.0 (Mapped Column typed syntax)
- **Database**: PostgreSQL 15 with pgvector extension (`ankane/pgvector`)
- **Containerization**: Docker and Docker Compose

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended for containerized execution)
- [Python 3.11+](https://www.python.org/downloads/) (if running locally without Docker)
- [Git](https://git-scm.com/)

---

## How to Run

### Method 1: Running with Docker Compose (Recommended)

This is the fastest method to spin up both PostgreSQL and the FastAPI application.

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd defectloupe
   ```

2. **Configure environment variables:**
   Create an `.env` file inside the `app/` directory (you can copy from `app/.env.example`):
   ```bash
   cp app/.env.example app/.env
   ```

3. **Start the containers:**
   ```bash
   docker compose up --build -d
   ```

4. **Verify application status:**
   - FastAPI Server: [http://localhost:8000](http://localhost:8000)
   - Interactive API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
   - Health check endpoint: [http://localhost:8000/](http://localhost:8000/)

5. **Stop the containers:**
   ```bash
   docker compose down
   ```

---

### Method 2: Running Locally with Python Virtual Environment

If you prefer developing directly on your host machine:

1. **Create and activate a virtual environment:**
   - On Windows (PowerShell):
     ```powershell
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```
   - On Linux / macOS:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the PostgreSQL database:**
   You can start just the database container:
   ```bash
   docker compose up -d db
   ```

4. **Run the FastAPI application:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## Connecting to Database via GUI Tools (TablePlus / DBeaver / pgAdmin)

The PostgreSQL database container exposes port **5433** to your host machine (to avoid conflicts with any local PostgreSQL installation on port 5432).

Use these credentials in your database client:

| Setting | Value |
| --- | --- |
| **Host** | `localhost` or `127.0.0.1` |
| **Port** | `5433` |
| **User** | `postgres` |
| **Password** | `postgres` |
| **Database** | `defect-loupe` |
| **SSL Mode** | `disable` or `prefer` |

---

## Environment Variables

| Variable | Description | Example (Docker) | Example (Local) |
| --- | --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@db:5432/defect-loupe` | `postgresql://postgres:postgres@localhost:5433/defect-loupe` |
| `ACCESS_TOKEN_SECRET` | Secret key for signing access tokens | `your_secret_string` | `your_secret_string` |
| `ACCESS_TOKEN_EXPIRY` | Access token lifespan | `15m` | `15m` |
| `REFRESH_TOKEN_SECRET` | Secret key for refresh tokens | `your_secret_string` | `your_secret_string` |
| `REFRESH_TOKEN_EXPIRY` | Refresh token lifespan | `10d` | `10d` |

---

## Project Structure

```text
defectloupe/
├── app/
│   ├── api/
│   │   ├── dtos/             # Pydantic validation schemas
│   │   └── routes/           # API route controllers
│   ├── config/
│   │   └── db_config.py      # SQLAlchemy engine and session factory
│   ├── repository/           # Database ORM models
│   │   ├── base.py           # DeclarativeBase base class
│   │   ├── user.py           # User authentication model
│   │   ├── company.py        # Agency company model
│   │   ├── inspector.py      # Inspector profile model
│   │   ├── client.py         # Client model
│   │   ├── property.py       # Property model
│   │   ├── inspection.py     # Inspection job model
│   │   ├── inspection_area.py# Inspection area model
│   │   ├── area_photo.py     # Area photo asset model
│   │   ├── area_observation.py # Text/Voice observation model
│   │   └── transcription.py  # Voice note transcription model
│   ├── services/             # Business logic layer
│   ├── utils/                # Utility helpers
│   ├── main.py               # FastAPI application entrypoint
│   └── .env.example          # App environment template
├── Dockerfile                # Backend container definition
├── docker-compose.yaml       # Multi-container orchestration
├── requirements.txt          # Python project dependencies
├── .gitignore                # Git ignore rules
└── README.md                 # Project documentation
```
