from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# Engine configuration prepared for PostgreSQL connection pool
# Uses sqlite in-memory fallback if postgres is not reachable during local unit test stage
engine = create_engine(
    settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql")
    if "postgresql" in settings.DATABASE_URL
    else "sqlite:///:memory:",
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
