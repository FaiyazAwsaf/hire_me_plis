from qdrant_client.models import FieldCondition, Filter, MatchValue

from app.config import settings
from app.core.qdrant_client import qdrant


async def scroll_section_texts(user_id: str, section: str) -> list[str]:
    """Return the text of all chunks in a given section for a user.

    Uses scroll() instead of search() — we want every chunk in the section,
    not the top-K most similar ones. Jaccard similarity needs the full picture.
    """
    results, _ = await qdrant.scroll(
        collection_name=settings.qdrant_collection,
        scroll_filter=Filter(
            must=[
                FieldCondition(key="user_id", match=MatchValue(value=user_id)),
                FieldCondition(key="section", match=MatchValue(value=section)),
            ]
        ),
        limit=100,  # skills sections are short — 100 chunks is more than enough
        with_payload=True,
        with_vectors=False,
    )
    return [point.payload["text"] for point in results]


async def get_user_experience_years(user_id: str) -> int:
    """Return the max experience_years value stamped on any chunk for this user.

    meta_extractor.py stamps experience_years on every chunk at ingestion time,
    so we can read it back here without a DB join. Returns 0 if no CV ingested yet.
    """
    results, _ = await qdrant.scroll(
        collection_name=settings.qdrant_collection,
        scroll_filter=Filter(
            must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
        ),
        limit=1,  # all chunks share the same value — one is enough
        with_payload=True,
        with_vectors=False,
    )
    if not results:
        return 0
    return results[0].payload.get("experience_years", 0)
