import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s: %(message)s")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import inspect, text
from app.database import engine, SessionLocal, Base
from app.models import User, ChatMessage, Article, Tag  # noqa: F401
from app.seed_data import seed_database
from app.routers import auth, users, chat, recommendations

logger = logging.getLogger(__name__)


def _migrate_articles_table(db):
    """Add new columns to existing articles table (safe for SQLite)."""
    cols = {c["name"] for c in inspect(db.bind).get_columns("articles")}
    if "source" not in cols:
        db.execute(text("ALTER TABLE articles ADD COLUMN source VARCHAR(20) DEFAULT 'seed'"))
        logger.info("Migrated articles table: added 'source' column")
    if "fetched_at" not in cols:
        db.execute(text("ALTER TABLE articles ADD COLUMN fetched_at DATETIME"))
        logger.info("Migrated articles table: added 'fetched_at' column")
    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _migrate_articles_table(db)
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Professional Platform API",
    description="A professional networking platform with AI-powered profile assistance and smart recommendations.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(chat.router)
app.include_router(recommendations.router)


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}
