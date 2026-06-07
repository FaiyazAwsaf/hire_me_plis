from datetime import date

from pydantic import BaseModel


class JobSearchRequest(BaseModel):
    query: str


class JobCard(BaseModel):
    id: str
    role: str
    company: str
    location: str
    salary_range: str | None = None
    deadline: date | None = None
    url: str
    source_platform: str | None = None
    fit_score: int
    fit_reasoning: str
    missing_skills: list[str] = []


class JobSearchResponse(BaseModel):
    results: list[JobCard]
    source: str
    total: int


class FitScoreRequest(BaseModel):
    jd_text: str


class ScoreBreakdown(BaseModel):
    skill_match: int
    semantic_match: int
    experience_match: int


class FitScoreResponse(BaseModel):
    score: int
    breakdown: ScoreBreakdown
    explanation: str


class CoverLetterRequest(BaseModel):
    role: str
    company: str
    jd_summary: str  # fit_reasoning or a short description of the role


class CoverLetterResponse(BaseModel):
    cover_letter: str
