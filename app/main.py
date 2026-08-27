from contextlib import asynccontextmanager
from fastapi import FastAPI
import uvicorn

from app.repository import Base
from app.config.db_config import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield
    engine.dispose()


app = FastAPI(lifespan=lifespan)


@app.get("/")
def root():
    return {"message": "Defect Loupe Backend is running!"}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="[IP_ADDRESS]", port=8000, reload=True)