import uuid
from datetime import date, timedelta

from sqlalchemy import cast, func, select
from sqlalchemy import Date as SADate
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import Application, ApplicationStatus
from app.models.cv import CVStatus, CVVersion
from app.models.goal import Goal
from app.schemas.dashboard import ApplicationStats, DashboardStatsResponse, GoalStats


async def get_stats(user_id: uuid.UUID, db: AsyncSession) -> DashboardStatsResponse:
    # Applications grouped by status
    result = await db.execute(
        select(Application.status, func.count(Application.id))
        .where(Application.user_id == user_id)
        .group_by(Application.status)
    )
    by_status: dict[str, int] = {s.value: 0 for s in ApplicationStatus}
    for status, count in result.all():
        by_status[status.value] = count
    total_apps = sum(by_status.values())

    # Goals: total + completed (non-NULL completed_at) in one query
    result = await db.execute(
        select(
            func.count(Goal.id),
            func.count(Goal.completed_at),  # counts non-NULL values only
        ).where(Goal.user_id == user_id)
    )
    total_goals, completed_goals = result.one()
    completion_pct = (
        round(completed_goals / total_goals * 100, 1) if total_goals > 0 else 0.0
    )

    # Streak: consecutive days going back from today with at least one application
    result = await db.execute(
        select(cast(Application.applied_at, SADate).label("day"))
        .where(Application.user_id == user_id)
        .distinct()
    )
    applied_dates: set[date] = {row.day for row in result.all()}
    streak = 0
    check = date.today()
    while check in applied_dates:
        streak += 1
        check -= timedelta(days=1)

    # CV on file: any cv_versions row with status=done
    result = await db.execute(
        select(CVVersion.id)
        .where(CVVersion.user_id == user_id, CVVersion.status == CVStatus.done)
        .limit(1)
    )
    cv_on_file = result.scalar_one_or_none() is not None

    return DashboardStatsResponse(
        applications=ApplicationStats(total=total_apps, by_status=by_status),
        goals=GoalStats(
            total=total_goals,
            completed=completed_goals,
            completion_pct=completion_pct,
        ),
        streak_days=streak,
        cv_on_file=cv_on_file,
    )
