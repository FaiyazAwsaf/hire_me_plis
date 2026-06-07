import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.dashboard import DashboardStatsResponse
from app.schemas.tracker import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationsResponse,
    ApplicationStatusUpdate,
    ApplicationUpdate,
    EventCreate,
    EventResponse,
    EventsResponse,
    EventUpdate,
    GoalCreate,
    GoalResponse,
    GoalsResponse,
    GoalUpdate,
    NudgeReadResponse,
    NudgesResponse,
)
from app.services import dashboard_service, nudge_service, tracker_service

router = APIRouter(tags=["tracker"])


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------


@router.get("/applications", response_model=ApplicationsResponse)
async def list_applications(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ApplicationsResponse:
    return await tracker_service.list_applications(current_user.id, db)


@router.post("/applications", response_model=ApplicationResponse, status_code=201)
async def create_application(
    payload: ApplicationCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ApplicationResponse:
    return await tracker_service.create_application(current_user.id, payload, db)


# /status must be registered before /{app_id} — FastAPI matches in order
@router.patch("/applications/{app_id}/status", response_model=ApplicationResponse)
async def update_application_status(
    app_id: uuid.UUID,
    payload: ApplicationStatusUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ApplicationResponse:
    return await tracker_service.update_application_status(
        app_id, current_user.id, payload, db
    )


@router.patch("/applications/{app_id}", response_model=ApplicationResponse)
async def update_application(
    app_id: uuid.UUID,
    payload: ApplicationUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ApplicationResponse:
    return await tracker_service.update_application(
        app_id, current_user.id, payload, db
    )


@router.delete("/applications/{app_id}", status_code=204)
async def delete_application(
    app_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await tracker_service.delete_application(app_id, current_user.id, db)
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# Goals
# ---------------------------------------------------------------------------


@router.get("/goals", response_model=GoalsResponse)
async def list_goals(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> GoalsResponse:
    return await tracker_service.list_goals(current_user.id, db)


@router.post("/goals", response_model=GoalResponse, status_code=201)
async def create_goal(
    payload: GoalCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> GoalResponse:
    return await tracker_service.create_goal(current_user.id, payload, db)


@router.patch("/goals/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: uuid.UUID,
    payload: GoalUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> GoalResponse:
    return await tracker_service.update_goal(goal_id, current_user.id, payload, db)


@router.delete("/goals/{goal_id}", status_code=204)
async def delete_goal(
    goal_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await tracker_service.delete_goal(goal_id, current_user.id, db)
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# Calendar Events
# ---------------------------------------------------------------------------


@router.get("/calendar/events", response_model=EventsResponse)
async def list_events(
    start: date,
    end: date,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EventsResponse:
    return await tracker_service.list_events(current_user.id, start, end, db)


@router.post("/calendar/events", response_model=EventResponse, status_code=201)
async def create_event(
    payload: EventCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EventResponse:
    return await tracker_service.create_event(current_user.id, payload, db)


@router.patch("/calendar/events/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: uuid.UUID,
    payload: EventUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EventResponse:
    return await tracker_service.update_event(event_id, current_user.id, payload, db)


@router.delete("/calendar/events/{event_id}", status_code=204)
async def delete_event(
    event_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await tracker_service.delete_event(event_id, current_user.id, db)
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------


@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
async def dashboard_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DashboardStatsResponse:
    return await dashboard_service.get_stats(current_user.id, db)


# ---------------------------------------------------------------------------
# Nudges (already wired — do not modify)
# ---------------------------------------------------------------------------


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
