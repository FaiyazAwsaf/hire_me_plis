from dataclasses import dataclass
from typing import TypedDict


@dataclass
class RawJob:
    id: str
    role: str
    company: str
    location: str
    salary_range: str | None
    # ISO date string, NOT datetime.date — LangGraph state is JSON-serialized between nodes
    deadline: str | None
    url: str
    description: str


class JobHunterState(TypedDict):
    query: str
    user_id: str       # str, not UUID — same JSON-serialization constraint
    role: str
    location: str
    date_from: str | None
    raw_jobs: list[dict]   # asdict(RawJob) entries — plain dicts, not RawJob objects
    job_cards: list[dict]
    source: str
