import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.tracker import NudgeReadResponse, NudgesResponse
from app.services import nudge_service

router = APIRouter(tags=["tracker"])

_NI = {"status": "not_implemented"}


@router.get("/applications")
async def list_applications():
    return _NI


@router.post("/applications")
async def create_application():
    return _NI


@router.patch("/applications/{app_id}")
async def update_application(app_id: str):
    return _NI


@router.delete("/applications/{app_id}")
async def delete_application(app_id: str):
    return _NI


@router.patch("/applications/{app_id}/status")
async def update_application_status(app_id: str):
    return _NI


@router.get("/goals")
async def list_goals():
    return _NI


@router.post("/goals")
async def create_goal():
    return _NI


@router.patch("/goals/{goal_id}")
async def update_goal(goal_id: str):
    return _NI


@router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str):
    return _NI


@router.get("/calendar/events")
async def list_events():
    return _NI


@router.post("/calendar/events")
async def create_event():
    return _NI


@router.patch("/calendar/events/{event_id}")
async def update_event(event_id: str):
    return _NI


@router.delete("/calendar/events/{event_id}")
async def delete_event(event_id: str):
    return _NI


@router.get("/nudges", response_model=NudgesResponse)
async def list_nudges(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NudgesResponse:
    return await nudge_service.list_nudges(current_user.id, db)


@router.patch("/nudges/{nudge_id}/read", response_model=NudgeReadResponse)
async def mark_nudge_read(
    nudge_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NudgeReadResponse:
    return await nudge_service.mark_nudge_read(nudge_id, current_user.id, db)


@router.get("/dashboard/stats")
async def dashboard_stats():
    return _NI
