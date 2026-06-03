import asyncio
import os

# Must be set before any app import — pydantic-settings reads env at Settings() instantiation time.
os.environ.setdefault(
    "DATABASE_URL",
    f"postgresql+asyncpg://{os.getenv('USER', 'postgres')}@localhost/hiremeplis_test",
)
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-tests-only-32chars!!")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
os.environ.setdefault("QDRANT_URL", "http://localhost:6333")
# R2 account ID must be non-empty — boto3 validates the endpoint URL at client creation time
os.environ.setdefault("R2_ACCOUNT_ID", "test-account-id")
os.environ.setdefault("R2_ACCESS_KEY_ID", "test-key-id")
os.environ.setdefault("R2_SECRET_ACCESS_KEY", "test-secret-key")
# ChatLLM base_url must be a valid URL — openai SDK validates it at client creation time
os.environ.setdefault("CHATLLM_BASE_URL", "https://test.chatllm.invalid/v1")
os.environ.setdefault("CHATLLM_API_KEY", "test-chatllm-key")
os.environ.setdefault("OPENAI_API_KEY", "test-openai-key")

# Unix socket + matching OS username → peer auth, no password required.
# One-time setup: sudo -u postgres createuser --superuser --createdb $USER
_PG_SOCKET_DIR = "/var/run/postgresql"
_PG_USER = os.getenv("USER", "postgres")
_TEST_DATABASE_URL = os.environ["DATABASE_URL"]

import asyncpg
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.database import Base
from app.deps import get_db
from app.main import app


def _make_engine():
    """Create a fresh engine using the Unix socket. Called inside each test's event loop."""
    return create_async_engine(
        _TEST_DATABASE_URL,
        echo=False,
        connect_args={"host": _PG_SOCKET_DIR},
    )


async def _create_schema() -> None:
    """Create the test DB and all tables (run once per session via asyncio.run)."""
    conn = await asyncpg.connect(
        host=_PG_SOCKET_DIR, port=5432, user=_PG_USER, database="postgres"
    )
    exists = await conn.fetchval(
        "SELECT 1 FROM pg_database WHERE datname = 'hiremeplis_test'"
    )
    if not exists:
        await conn.execute("CREATE DATABASE hiremeplis_test")
    await conn.close()

    engine = _make_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()


async def _drop_schema() -> None:
    engine = _make_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture(scope="session", autouse=True)
def db_setup():
    """Create tables once before the session; drop them after.

    If PostgreSQL is unavailable (e.g. pure unit test run), the setup is
    skipped gracefully — DB-dependent fixtures (db, client) will error only
    for tests that actually request them.
    """
    try:
        asyncio.run(_create_schema())
    except Exception:
        yield  # no DB available; unit tests that don't use 'db' can still run
        return
    yield
    asyncio.run(_drop_schema())


@pytest_asyncio.fixture
async def db(db_setup):
    """
    Yield an AsyncSession for the test.
    After the test, truncate all user-related tables using a fresh session
    so there's no state bleed from the endpoint's commit.
    """
    engine = _make_engine()
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        yield session

    # Teardown: fresh session avoids 'operation in progress' from the endpoint's commit.
    async with session_factory() as cleanup:
        await cleanup.execute(text("TRUNCATE TABLE users CASCADE"))
        await cleanup.commit()

    await engine.dispose()


@pytest_asyncio.fixture
async def client(db):
    """AsyncClient wired to the FastAPI app with get_db overridden to the test session."""
    async def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def registered_user(client):
    """Register a test user and return their credentials and token."""
    resp = await client.post("/auth/register", json={
        "email": "fixture@test.com",
        "password": "password123",
    })
    data = resp.json()
    return {
        "email": "fixture@test.com",
        "password": "password123",
        "token": data["access_token"],
        "user": data["user"],
    }
