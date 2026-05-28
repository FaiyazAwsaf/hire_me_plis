from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams
from app.config import settings

qdrant = AsyncQdrantClient(url=settings.qdrant_url)


async def ensure_collection() -> None:
    """Create cv_chunks collection if it does not already exist."""
    collections = await qdrant.get_collections()
    names = [c.name for c in collections.collections]
    if settings.qdrant_collection not in names:
        await qdrant.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
        )
