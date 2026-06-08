import uuid
from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.fit_scorer.scorer import score
from app.ai.agents.job_hunter.graph import agent
from app.ai.llm.generate import generate
from app.ai.llm.prompts.cover_letter import cover_letter_prompt, refine_cover_letter_prompt
from app.ai.rag.context import build_context
from app.ai.rag.retriever import retrieve
from app.core.llm_client import HEAVY_MODEL
from app.models.cv import CVStatus, CVVersion
from app.schemas.jobs import (
    CoverLetterResponse,
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
            missing_skills=card.get("missing_skills", []),
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


async def generate_cover_letter(
    role: str,
    company: str,
    jd_summary: str,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> CoverLetterResponse:
    """Generate a personalized cover letter grounded in the user's CV via RAG.

    Uses the job's role/company/fit_reasoning as the JD context (the full JD text is
    not stored in the job card) and retrieves the user's most relevant CV chunks to
    ground every claim in their actual experience.
    """
    await _require_cv(user_id, db)

    # RAG: retrieve the most relevant CV chunks for this specific role
    query = f"{role} at {company}: {jd_summary}"
    chunks = await retrieve(query, str(user_id), top_k=6)
    cv_context = build_context(chunks)

    letter = await generate(
        prompt=cover_letter_prompt(role, company, jd_summary, cv_context),
        model=HEAVY_MODEL,
    )

    return CoverLetterResponse(cover_letter=letter)


async def refine_cover_letter(
    cover_letter: str,
    instruction: str,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> CoverLetterResponse:
    """Apply a targeted edit to an existing cover letter.

    No RAG re-retrieval — the letter already contains CV context from the initial
    generation; refinements are almost always stylistic or structural changes.
    """
    await _require_cv(user_id, db)

    refined = await generate(
        prompt=refine_cover_letter_prompt(cover_letter, instruction),
        model=HEAVY_MODEL,
    )

    return CoverLetterResponse(cover_letter=refined)


def _parse_date(value: str | None) -> date | None:
    """Convert an ISO date string from agent state to a Python date for the API schema."""
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        return None
