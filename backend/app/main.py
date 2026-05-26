from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.chat import router as chat_router
from app.routers.cv import router as cv_router
from app.routers.jobs import router as jobs_router
from app.routers.tracker import router as tracker_router

app = FastAPI(title="Hire Me Plis API", version="0.1.0")

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
