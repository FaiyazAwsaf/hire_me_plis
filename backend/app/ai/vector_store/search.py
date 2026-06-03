from dataclasses import dataclass

from qdrant_client.models import FieldCondition, Filter, MatchValue

from app.config import settings
from app.core.qdrant_client import qdrant


@dataclass
class SearchResult:
    text: str
    section: str
    score: float
    chunk_index: int


async def search_chunks(
    query_vector: list[float],
    user_id: str,
    top_k: int = 5,
    section: str | None = None,
) -> list[SearchResult]:
    """Similarity search over cv_chunks, always filtered to a single user.

    section — if provided, restricts the search to chunks from that CV section only.
    Returns an empty list if the user has no CV uploaded — never raises on zero results.
    """
    must_conditions = [FieldCondition(key="user_id", match=MatchValue(value=user_id))]
    if section:
        must_conditions.append(FieldCondition(key="section", match=MatchValue(value=section)))

    user_filter = Filter(must=must_conditions)
    hits = await qdrant.search(
        collection_name=settings.qdrant_collection,
        query_vector=query_vector,
        query_filter=user_filter,
        limit=top_k,
        with_payload=True,
        with_vectors=False,
    )
    return [
        SearchResult(
            text=hit.payload["text"],
            section=hit.payload["section"],
            score=hit.score,
            chunk_index=hit.payload["chunk_index"],
        )
        for hit in hits
    ]
