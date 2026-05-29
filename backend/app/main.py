from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.qdrant_client import ensure_collection
from app.routers.auth import router as auth_router
from app.routers.chat import router as chat_router
from app.routers.cv import router as cv_router
from app.routers.jobs import router as jobs_router
from app.routers.tracker import router as tracker_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Deferred imports avoid circular import: arq → app.config at module load time
    from arq import create_pool
    from arq.connections import RedisSettings
    from app.config import settings

    # arq_pool is stored on app.state so get_arq_pool() dependency can retrieve it per-request
    app.state.arq_pool = await create_pool(RedisSettings.from_dsn(settings.redis_url))
    await ensure_collection()
    yield
    await app.state.arq_pool.aclose()  # aclose() is the async variant of close()


app = FastAPI(title="Hire Me Plis API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(cv_router)
app.include_router(jobs_router)
app.include_router(chat_router)
app.include_router(tracker_router)


@app.get("/", tags=["health"])
async def health_check() -> dict:
    """Liveness probe."""
    return {"status": "ok", "version": "0.1.0"}
