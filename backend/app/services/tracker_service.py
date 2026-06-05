import uuid
from datetime import date, datetime, time, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import Application, ApplicationStatus
from app.models.calendar_event import CalendarEvent
from app.models.goal import Goal
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
)


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------


async def list_applications(
    user_id: uuid.UUID, db: AsyncSession
) -> ApplicationsResponse:
    result = await db.execute(
        select(Application)
        .where(Application.user_id == user_id)
        .order_by(Application.applied_at.desc())
    )
    apps = result.scalars().all()
    return ApplicationsResponse(
        applications=[ApplicationResponse.model_validate(a) for a in apps]
    )


async def create_application(
    user_id: uuid.UUID, payload: ApplicationCreate, db: AsyncSession
) -> ApplicationResponse:
    app = Application(user_id=user_id, **payload.model_dump())
    db.add(app)
    await db.commit()
    return ApplicationResponse.model_validate(app)


async def update_application_status(
    app_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: ApplicationStatusUpdate,
    db: AsyncSession,
) -> ApplicationResponse:
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if app is None:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorised")
    app.status = payload.status
    await db.commit()
    return ApplicationResponse.model_validate(app)


async def update_application(
    app_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: ApplicationUpdate,
    db: AsyncSession,
) -> ApplicationResponse:
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if app is None:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorised")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(app, k, v)
    await db.commit()
    return ApplicationResponse.model_validate(app)


async def delete_application(
    app_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession
) -> None:
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if app is None:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorised")
    await db.delete(app)
    await db.commit()


# ---------------------------------------------------------------------------
# Goals
# ---------------------------------------------------------------------------


async def list_goals(user_id: uuid.UUID, db: AsyncSession) -> GoalsResponse:
    result = await db.execute(
        select(Goal)
        .where(Goal.user_id == user_id)
        .order_by(Goal.target_date.asc())
    )
    goals = result.scalars().all()
    return GoalsResponse(goals=[GoalResponse.model_validate(g) for g in goals])


async def create_goal(
    user_id: uuid.UUID, payload: GoalCreate, db: AsyncSession
) -> GoalResponse:
    goal = Goal(user_id=user_id, **payload.model_dump())
    db.add(goal)
    await db.commit()
    return GoalResponse.model_validate(goal)


async def update_goal(
    goal_id: uuid.UUID, user_id: uuid.UUID, payload: GoalUpdate, db: AsyncSession
) -> GoalResponse:
    result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = result.scalar_one_or_none()
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    if goal.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorised")

    updates = payload.model_dump(exclude_unset=True)

    # `completed` is a schema sentinel — translate to the ORM's completed_at column
    if "completed" in updates:
        completed = updates.pop("completed")
        goal.completed_at = datetime.now(timezone.utc) if completed else None

    for k, v in updates.items():
        setattr(goal, k, v)

    await db.commit()
    return GoalResponse.model_validate(goal)


async def delete_goal(
    goal_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession
) -> None:
    result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = result.scalar_one_or_none()
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    if goal.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorised")
    await db.delete(goal)
    await db.commit()


# ---------------------------------------------------------------------------
# Calendar Events
# ---------------------------------------------------------------------------


async def list_events(
    user_id: uuid.UUID, start: date, end: date, db: AsyncSession
) -> EventsResponse:
    # Overlap predicate: event overlaps window if it starts before the window ends
    # and ends after the window starts — catches multi-day events crossing boundaries
    start_dt = datetime.combine(start, time.min, tzinfo=timezone.utc)
    end_dt = datetime.combine(end, time.max, tzinfo=timezone.utc)

    result = await db.execute(
        select(CalendarEvent)
        .where(
            CalendarEvent.user_id == user_id,
            CalendarEvent.start_dt < end_dt,
            CalendarEvent.end_dt > start_dt,
        )
        .order_by(CalendarEvent.start_dt.asc())
    )
    events = result.scalars().all()
    return EventsResponse(events=[EventResponse.model_validate(e) for e in events])


async def create_event(
    user_id: uuid.UUID, payload: EventCreate, db: AsyncSession
) -> EventResponse:
    if payload.end_dt <= payload.start_dt:
        raise HTTPException(status_code=400, detail="end_dt must be after start_dt")

    if payload.goal_id is not None:
        goal_result = await db.execute(
            select(Goal).where(Goal.id == payload.goal_id)
        )
        goal = goal_result.scalar_one_or_none()
        if goal is None or goal.user_id != user_id:
            raise HTTPException(status_code=404, detail="Goal not found")

    event = CalendarEvent(user_id=user_id, **payload.model_dump())
    db.add(event)
    await db.commit()
    return EventResponse.model_validate(event)


async def update_event(
    event_id: uuid.UUID, user_id: uuid.UUID, payload: EventUpdate, db: AsyncSession
) -> EventResponse:
    result = await db.execute(
        select(CalendarEvent).where(CalendarEvent.id == event_id)
    )
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorised")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(event, k, v)

    if event.end_dt <= event.start_dt:
        raise HTTPException(status_code=400, detail="end_dt must be after start_dt")

    await db.commit()
    return EventResponse.model_validate(event)


async def delete_event(
    event_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession
) -> None:
    result = await db.execute(
        select(CalendarEvent).where(CalendarEvent.id == event_id)
    )
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorised")
    await db.delete(event)
    await db.commit()
