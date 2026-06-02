import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.fit_scorer.scorer import score
from app.models.cv import CVStatus, CVVersion
from app.schemas.jobs import FitScoreResponse, ScoreBreakdown


async def fit_score_job(
    jd_text: str,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> FitScoreResponse:
    """Guard that a processed CV exists, run the scorer, return the API schema.

    Fails fast with 404 if no CV with status=done exists — scoring against an empty
    Qdrant collection would silently produce a meaningless 0/0/0 breakdown.
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
