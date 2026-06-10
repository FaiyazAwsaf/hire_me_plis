import uuid
from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm.generate import generate
from app.ai.llm.prompts.cover_letter import cover_letter_prompt, refine_cover_letter_prompt
from app.ai.rag.context import build_context
from app.ai.rag.retriever import retrieve
from app.core.llm_client import HEAVY_MODEL
from app.models.cv import CVStatus, CVVersion
from app.models.user import CHAT_MESSAGE_LIMIT, JOB_SEARCH_LIMIT, User
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
    # lazy import — jobspy/pandas load only on first request, not at startup
    from app.ai.agents.fit_scorer.scorer import score

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
    # lazy import — pulls in langgraph + jobspy + pandas, skip at startup
    from app.ai.agents.job_hunter.graph import agent

    await _require_cv(user_id, db)
    await _check_job_search_limit(user_id, db)

    state = await agent.ainvoke({
        "query": query,
        "user_id": str(user_id),
        "role": "",
        "location": "",
        "date_from": None,
        "raw_jobs": [],
        "job_cards": [],
        "source": "",
    })

    # Increment after a successful search
    await _increment_job_searches(user_id, db)

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


async def generate_cover_letter(
    role: str,
    company: str,
    jd_summary: str,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> CoverLetterResponse:
    await _require_cv(user_id, db)

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
    await _require_cv(user_id, db)

    refined = await generate(
        prompt=refine_cover_letter_prompt(cover_letter, instruction),
        model=HEAVY_MODEL,
    )

    return CoverLetterResponse(cover_letter=refined)


async def _require_cv(user_id: uuid.UUID, db: AsyncSession) -> None:
    """Raise 404 if the user has no CV with status=done."""
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


async def _check_job_search_limit(user_id: uuid.UUID, db: AsyncSession) -> None:
    """Raise 429 if the user has exhausted their job search quota (admins are exempt)."""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user and not user.is_admin and user.job_searches_used >= JOB_SEARCH_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"You have used all {JOB_SEARCH_LIMIT} job search requests. Contact faiyazawsaf11@gmail.com to get more.",
        )


async def _increment_job_searches(user_id: uuid.UUID, db: AsyncSession) -> None:
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user and not user.is_admin:
        user.job_searches_used += 1
        await db.commit()


async def _check_chat_limit(user_id: uuid.UUID, db: AsyncSession) -> None:
    """Raise 429 if the user has exhausted their chat quota (admins are exempt)."""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user and not user.is_admin and user.chat_messages_used >= CHAT_MESSAGE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"You have used all {CHAT_MESSAGE_LIMIT} AI assistant messages. Contact faiyazawsaf11@gmail.com to get more.",
        )


async def _increment_chat_messages(user_id: uuid.UUID, db: AsyncSession) -> None:
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user and not user.is_admin:
        user.chat_messages_used += 1
        await db.commit()


def _parse_date(value: str | None) -> date | None:
    """Convert an ISO date string from agent state to a Python date for the API schema."""
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        return None
