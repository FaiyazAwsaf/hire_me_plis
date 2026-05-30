from collections.abc import Callable
from dataclasses import dataclass

from app.ai.cv_pipeline.classifier import classify_sections
from app.ai.cv_pipeline.chunker import chunk_sections
from app.ai.cv_pipeline.embedder import embed_and_upsert
from app.ai.cv_pipeline.meta_extractor import extract_cv_meta
from app.ai.cv_pipeline.parser import parse_file
from app.ai.vector_store.delete import delete_by_user


@dataclass
class PipelineResult:
    success: bool
    chunk_count: int = 0
    error: str | None = None


async def run_cv_pipeline(
    user_id: str,
    cv_version_id: str,
    r2_key: str,
    file_type: str,
    update_status_fn: Callable,  # async (cv_version_id, status, error_msg=None) → None
) -> PipelineResult:
    """Orchestrate the full CV ingestion pipeline.

    update_status_fn is injected by the ARQ task so this function never
    touches the database directly — keeping the ai/ layer dependency-free.
    """
    try:
        await update_status_fn(cv_version_id, "processing")

        blocks = await parse_file(r2_key, file_type)
        classified = await classify_sections(blocks)
        chunks = chunk_sections(classified)

        # Extract role + experience metadata once; stamped onto every Qdrant point below
        cv_meta = await extract_cv_meta(classified)

        # Delete before embedding — ensures no orphaned chunks from previous runs remain
        await delete_by_user(user_id)

        await update_status_fn(cv_version_id, "embedding")

        count = await embed_and_upsert(chunks, user_id, cv_version_id, cv_meta)

        await update_status_fn(cv_version_id, "done")
        return PipelineResult(success=True, chunk_count=count)

    except Exception as e:
        await update_status_fn(cv_version_id, "error", error_msg=str(e))
        return PipelineResult(success=False, error=str(e))
