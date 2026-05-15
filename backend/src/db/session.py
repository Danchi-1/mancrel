"""
db/session.py
=============
SQLAlchemy database session configuration.
"""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from core.config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    # SQLite-specific config, ignored by Postgres
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

async def get_db():
    """
    Dependency for FastAPI endpoints to get an async database session.
    """
    async with AsyncSessionLocal() as session:
        yield session
