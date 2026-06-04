from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.jobs import (
    FitScoreRequest,
    FitScoreResponse,
    JobSearchRequest,
    JobSearchResponse,
)
from app.services import job_service

router = APIRouter(prefix="/jobs", tags=["jobs"])

_DB = Annotated[AsyncSession, Depends(get_db)]
_User = Annotated[User, Depends(get_current_user)]


@router.post("/score", response_model=FitScoreResponse)
async def score_job(body: FitScoreRequest, current_user: _User, db: _DB):
    return await job_service.fit_score_job(body.jd_text, current_user.id, db)


@router.post("/search", response_model=JobSearchResponse)
async def search_jobs(body: JobSearchRequest, current_user: _User, db: _DB):
    return await job_service.search_jobs(body.query, current_user.id, db)
