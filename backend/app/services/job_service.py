import uuid
from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.fit_scorer.scorer import score
from app.ai.agents.job_hunter.graph import agent
from app.models.cv import CVStatus, CVVersion
from app.schemas.jobs import (
    FitScoreResponse,
    JobCard,
    JobSearchResponse,
    ScoreBreakdown,
)


async def fit_score_job(
    jd_text: str,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> FitScoreResponse:
    """Guard that a processed CV exists, run the scorer, return the API schema.

    Fails fast with 404 if no CV with status=done exists — scoring against an empty
    Qdrant collection would silently produce a meaningless 0/0/0 breakdown.
    """
    await _require_cv(user_id, db)

    result = await score(jd_text, str(user_id))

    return FitScoreResponse(
        score=result.score,
        breakdown=ScoreBreakdown(
            skill_match=result.skill_match,
            semantic_match=result.semantic_match,
            experience_match=result.experience_match,
        ),
        explanation=result.explanation,
    )


async def search_jobs(
    query: str,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> JobSearchResponse:
    """Run the Job Hunter Agent and return fit-scored job cards.

    Requires a processed CV — the agent's score_node reads from Qdrant, which
    would return empty results (all-zero scores) without one.
    """
    await _require_cv(user_id, db)

    state = await agent.ainvoke({
        "query": query,
        "user_id": str(user_id),  # str, not UUID — agent state is JSON-serialized
        "role": "",
        "location": "",
        "date_from": None,
        "raw_jobs": [],
        "job_cards": [],
        "source": "",
    })

    job_cards = [
        JobCard(
            id=card["id"],
            role=card["role"],
            company=card["company"],
            location=card["location"],
            salary_range=card.get("salary_range"),
            deadline=_parse_date(card.get("deadline")),
            url=card["url"],
            source_platform=card.get("source_platform"),
            fit_score=card["fit_score"],
            fit_reasoning=card["fit_reasoning"],
        )
        for card in state.get("job_cards", [])
    ]

    return JobSearchResponse(
        results=job_cards,
        source=state.get("source", ""),
        total=len(job_cards),
    )


async def _require_cv(user_id: uuid.UUID, db: AsyncSession) -> None:
    """Raise 404 if the user has no CV with status=done.

    Shared by fit_score_job and search_jobs — both need Qdrant data to be populated.
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
        raise HTTPException(
            status_code=404,
            detail="No processed CV on file. Upload and process a CV first.",
        )


def _parse_date(value: str | None) -> date | None:
    """Convert an ISO date string from agent state to a Python date for the API schema."""
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        return None
