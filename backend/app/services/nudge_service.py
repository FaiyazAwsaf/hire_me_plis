import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm.generate import generate
from app.ai.llm.prompts.nudge import NudgeStats, nudge_prompt
from app.core.llm_client import LIGHT_MODEL
from app.models.application import Application
from app.models.cv import CVStatus, CVVersion
from app.models.goal import Goal
from app.models.nudge import Nudge
from app.schemas.tracker import NudgeReadResponse, NudgeResponse, NudgesResponse


async def generate_nudge_for_user(user_id: uuid.UUID, db: AsyncSession) -> Nudge | None:
    """Generate and persist one nudge for a user.

    Returns None silently if no processed CV exists — safe to call from a
    background task where raising HTTPException would be meaningless.
    """
    cv = (
        await db.execute(
            select(CVVersion)
            .where(CVVersion.user_id == user_id)
            .where(CVVersion.status == CVStatus.done)
            .limit(1)
        )
    ).scalar_one_or_none()
    if cv is None:
        return None

    # func.count() returns a scalar integer — no rows hydrated
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    applied_last_7_days = (
        await db.execute(
            select(func.count())
            .select_from(Application)
            .where(Application.user_id == user_id)
            .where(Application.applied_at >= cutoff)
        )
    ).scalar()

    total_applications = (
        await db.execute(
            select(func.count())
            .select_from(Application)
            .where(Application.user_id == user_id)
        )
    ).scalar()

    # Goals where completed_at IS NULL are still active
    active_goals = list(
        (
            await db.execute(
                select(Goal.title)
                .where(Goal.user_id == user_id)
                .where(Goal.completed_at.is_(None))
            )
        ).scalars().all()
    )

    stats = NudgeStats(
        applied_last_7_days=applied_last_7_days,
        active_goals=active_goals,
        total_applications=total_applications,
    )
    body = await generate(prompt=nudge_prompt(stats), model=LIGHT_MODEL)

    nudge = Nudge(user_id=user_id, body=body)
    db.add(nudge)
    await db.commit()
    # Refresh to populate server-generated fields (id, created_at)
    await db.refresh(nudge)
    return nudge


async def list_nudges(user_id: uuid.UUID, db: AsyncSession) -> NudgesResponse:
    """Return all nudges for a user, newest first, with unread count."""
    nudges = list(
        (
            await db.execute(
                select(Nudge)
                .where(Nudge.user_id == user_id)
                .order_by(Nudge.created_at.desc())
            )
        ).scalars().all()
    )

    # Compute unread_count from the fetched list — avoids a second DB round-trip
    unread_count = sum(1 for n in nudges if not n.read)
    return NudgesResponse(
        nudges=[NudgeResponse.model_validate(n) for n in nudges],
        unread_count=unread_count,
    )


async def mark_nudge_read(
    nudge_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> NudgeReadResponse:
    """Mark a nudge as read. Raises 404 if not found, 403 if not owned by user."""
    nudge = (
        await db.execute(select(Nudge).where(Nudge.id == nudge_id))
    ).scalar_one_or_none()

    if nudge is None:
        raise HTTPException(status_code=404, detail="Nudge not found")
    if nudge.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorised")

    nudge.read = True
    await db.commit()
    return NudgeReadResponse(id=nudge.id, read=True)
