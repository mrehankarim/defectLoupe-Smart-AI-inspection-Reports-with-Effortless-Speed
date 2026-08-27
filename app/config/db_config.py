import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
load_dotenv()

ENV_PATH=Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

DATABASE_URL=os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(f"DATABASE_URL is not set. Expected it in {ENV_PATH}")

engine=create_engine(DATABASE_URL)

SessionLocal=sessionmaker(autocommit=False,autoflush=False,bind=engine)


def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()