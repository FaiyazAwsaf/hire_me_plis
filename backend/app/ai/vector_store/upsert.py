from qdrant_client.models import PointStruct

from app.ai.vector_store import CVChunkPoint
from app.config import settings
from app.core.qdrant_client import qdrant


async def upsert_chunks(points: list[CVChunkPoint]) -> None:
    """Write a batch of CV chunk vectors to Qdrant."""
    qdrant_points = [
        PointStruct(
            id=p.id,
            vector=p.vector,
            payload={
                "user_id": p.user_id,       # REQUIRED — filter on every search query
                "cv_id": p.cv_id,
                "section": p.section,
                "chunk_index": p.chunk_index,
                "text": p.text,
                "token_count": p.token_count,
            },
        )
        for p in points
    ]
    await qdrant.upsert(
        collection_name=settings.qdrant_collection,
        points=qdrant_points,
    )
