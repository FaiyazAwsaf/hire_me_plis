from qdrant_client.models import FieldCondition, Filter, MatchValue

from app.config import settings
from app.core.qdrant_client import qdrant


async def delete_by_user(user_id: str) -> None:
    """Delete all Qdrant chunks for a user. Always called before re-embedding.

    Filtering by user_id (not cv_id) ensures a clean slate even if a previous
    pipeline run left orphaned chunks under a different cv_version_id.
    """
    await qdrant.delete(
        collection_name=settings.qdrant_collection,
        points_selector=Filter(
            must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
        ),
    )
