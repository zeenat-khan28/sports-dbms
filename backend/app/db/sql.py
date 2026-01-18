from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import get_settings

settings = get_settings()

# Create async engine
engine = create_async_engine(
    settings.SQL_DATABASE_URI,
    echo=True,  # Set to False in production
    future=True
)

# Async session factory
async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for SQL models
Base = declarative_base()


async def init_sql_db():
    """Initialize SQL database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ SQL Database tables created")


async def get_sql_session() -> AsyncSession:
    """Dependency to get async SQL session."""
    async with async_session() as session:
        yield session
