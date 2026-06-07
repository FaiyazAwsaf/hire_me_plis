import logging

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.cv import CVStatus, CVVersion
from app.services.nudge_service import generate_nudge_for_user

logger = logging.getLogger(__name__)


async def generate_nudges(ctx: dict) -> None:
    """Daily ARQ cron task — generate one nudge per user who has a CV on file.

    Uses a Redis lock per user (24h TTL) to prevent duplicate nudges if the
    worker restarts mid-run. Each user gets its own DB session so a single
    long-running LLM call never holds a connection open for the entire batch.
    """
    # Session 1: fetch all eligible user_ids, then close immediately
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(CVVersion.user_id)
            .where(CVVersion.status == CVStatus.done)
            .distinct()
        )
        user_ids = result.scalars().all()

    for user_id in user_ids:
        # Atomic SET NX — skip if nudge already generated for this user today
        lock_key = f"nudge_lock:{user_id}"
        was_set = await ctx["redis"].set(lock_key, "1", nx=True, ex=86400)
        if not was_set:
            logger.info("Nudge lock held for user %s — skipping", user_id)
            continue

        try:
            # Session 2: one session per user — not held across the full loop
            async with AsyncSessionLocal() as db:
                nudge = await generate_nudge_for_user(user_id, db)
                if nudge:
                    logger.info("Generated nudge for user %s", user_id)
        except Exception:
            # Per-user exception isolation — one failure never cancels the batch
            logger.exception("Nudge generation failed for user %s", user_id)
