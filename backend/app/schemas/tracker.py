import enum
import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ApplicationStatus(str, enum.Enum):
    shortlist = "shortlist"
    applied = "applied"
    interviewing = "interviewing"
    offer = "offer"
    rejected = "rejected"


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------

class ApplicationCreate(BaseModel):
    role: str
    company: str
    url: str | None = None
    status: ApplicationStatus = ApplicationStatus.applied
    notes: str | None = None
    deadline: date | None = None
    salary_range: str | None = None
    cover_letter_url: str | None = None
    jd_text: str | None = None


class ApplicationUpdate(BaseModel):
    """Partial update — excludes status (use ApplicationStatusUpdate for that)."""
    role: str | None = None
    company: str | None = None
    url: str | None = None
    notes: str | None = None
    deadline: date | None = None
    salary_range: str | None = None
    cover_letter_url: str | None = None


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: str
    company: str
    url: str | None = None
    status: ApplicationStatus
    notes: str | None = None
    deadline: date | None = None
    salary_range: str | None = None
    cover_letter_url: str | None = None
    jd_text: str | None = None
    applied_at: datetime


class ApplicationsResponse(BaseModel):
    applications: list[ApplicationResponse]


# ---------------------------------------------------------------------------
# Goals
# ---------------------------------------------------------------------------

class GoalCreate(BaseModel):
    title: str
    target_date: date


class GoalUpdate(BaseModel):
    title: str | None = None
    target_date: date | None = None
    completed: bool | None = None


class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    target_date: date
    completed_at: datetime | None = None


class GoalsResponse(BaseModel):
    goals: list[GoalResponse]


# ---------------------------------------------------------------------------
# Calendar events
# ---------------------------------------------------------------------------

class EventCreate(BaseModel):
    title: str
    start_dt: datetime
    end_dt: datetime
    goal_id: uuid.UUID | None = None


class EventUpdate(BaseModel):
    title: str | None = None
    start_dt: datetime | None = None
    end_dt: datetime | None = None


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    start_dt: datetime
    end_dt: datetime
    goal_id: uuid.UUID | None = None


class EventsResponse(BaseModel):
    events: list[EventResponse]


# ---------------------------------------------------------------------------
# Nudges
# ---------------------------------------------------------------------------

class NudgeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    body: str
    read: bool
    created_at: datetime


class NudgesResponse(BaseModel):
    nudges: list[NudgeResponse]
    unread_count: int


class NudgeReadResponse(BaseModel):
    id: uuid.UUID
    read: bool = True
