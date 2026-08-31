"""Create media-service tables via raw SQL (avoids cross-service FK issues)."""
import os, sys
sys.path.insert(0, ".")
sys.path.insert(0, "../..")

os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:5433/defect-loupe"

from shared.db_config import engine
from sqlalchemy import text

with engine.begin() as conn:
    # Create enum type if not exists
    conn.execute(text("""
        DO $$ BEGIN
            CREATE TYPE observation_type_enum AS ENUM ('text', 'voice');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """))

    # area_photos
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS area_photos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            inspection_area_id UUID NOT NULL REFERENCES inspection_areas(id) ON DELETE CASCADE,
            photo_url TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now()
        )
    """))

    # area_observations
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS area_observations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            inspection_area_id UUID NOT NULL REFERENCES inspection_areas(id) ON DELETE CASCADE,
            photo_id UUID REFERENCES area_photos(id) ON DELETE SET NULL,
            observation_type observation_type_enum NOT NULL,
            observation_text TEXT,
            audio_url TEXT,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        )
    """))

    # transcriptions
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS transcriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            observation_id UUID NOT NULL UNIQUE REFERENCES area_observations(id) ON DELETE CASCADE,
            transcription_text TEXT NOT NULL,
            confidence FLOAT,
            created_at TIMESTAMPTZ DEFAULT now()
        )
    """))

print("Media-service tables created successfully!")

# Verify
from sqlalchemy import inspect as sa_inspect
insp = sa_inspect(engine)
tables = insp.get_table_names()
print(f"Tables in DB: {sorted(tables)}")
