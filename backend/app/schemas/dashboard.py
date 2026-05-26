from pydantic import BaseModel


class ApplicationStats(BaseModel):
    total: int
    by_status: dict[str, int]


class GoalStats(BaseModel):
    total: int
    completed: int
    completion_pct: float


class DashboardStatsResponse(BaseModel):
    applications: ApplicationStats
    goals: GoalStats
    streak_days: int
    cv_on_file: bool
