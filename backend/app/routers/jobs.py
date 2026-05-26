from fastapi import APIRouter

router = APIRouter(prefix="/jobs", tags=["jobs"])

_NI = {"status": "not_implemented"}


@router.post("/search")
async def search_jobs():
    return _NI


@router.post("/score")
async def score_job():
    return _NI
