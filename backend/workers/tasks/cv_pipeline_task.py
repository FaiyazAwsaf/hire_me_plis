from app.ai.cv_pipeline.pipeline import run_cv_pipeline
from app.database import AsyncSessionLocal
from app.models.cv import CVStatus, CVVersion


async def process_cv(
    ctx: dict,  # ARQ injects this — contains the Redis connection
    cv_version_id: str,
    user_id: str,
    r2_key: str,
    file_type: str,
) -> None:
    """ARQ task: runs the full CV ingestion pipeline for a single upload."""
    async with AsyncSessionLocal() as db:

        async def update_status(
            cv_id: str, status: str, error_msg: str | None = None
        ) -> None:
            # Closure captures db — avoids threading the session through the pipeline
            cv = await db.get(CVVersion, cv_id)
            if cv is None:
                return
            cv.status = CVStatus(status)
            cv.error_msg = error_msg
            await db.commit()

        await run_cv_pipeline(
            user_id=user_id,
            cv_version_id=cv_version_id,
            r2_key=r2_key,
            file_type=file_type,
            update_status_fn=update_status,
        )
