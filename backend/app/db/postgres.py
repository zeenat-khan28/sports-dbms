"""PostgreSQL async database connection using SQLAlchemy."""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
import ssl

class Base(DeclarativeBase):
    """Base class for all SQL models."""
    pass


# Fix the connection URL for asyncpg
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Remove params that asyncpg doesn't support in the DSN
database_url = database_url.replace("sslmode=require", "")
database_url = database_url.replace("channel_binding=require", "")

# Clean up URL if needed (remove trailing ? or &)
database_url = database_url.replace("?&", "?")
database_url = database_url.replace("&&", "&")
if database_url.endswith("?") or database_url.endswith("&"):
    database_url = database_url.rstrip("?&")

# Create SSL context for Neon/Cloud Postgres
# ssl_context = ssl.create_default_context()
# ssl_context.check_hostname = False
# ssl_context.verify_mode = ssl.CERT_NONE

engine = create_async_engine(
    database_url,
    echo=False,
    future=True,
    pool_pre_ping=True,
    # Pass SSL explicitly for asyncpg
    connect_args={
        "ssl": "require",  # accepted by asyncpg for 'require' behavior
        "server_settings": {
            "application_name": "rvce-sports-backend"
        }
    }
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def init_postgres_db():
    """Create all tables in the PostgreSQL database."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ PostgreSQL tables created successfully")


async def get_postgres_session():
    """Dependency for getting async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
