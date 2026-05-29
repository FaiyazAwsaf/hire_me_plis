import uuid

from app.ai.cv_pipeline.chunker import Chunk
from app.ai.embeddings.batch import embed_batch
from app.ai.vector_store import CVChunkPoint
from app.ai.vector_store.upsert import upsert_chunks


async def embed_and_upsert(chunks: list[Chunk], user_id: str, cv_version_id: str) -> int:
    """Embed all chunks in one batch API call and upsert to Qdrant.

    Returns the number of points written.
    """
    texts = [c.text for c in chunks]
    vectors = await embed_batch(texts)

    points = [
        CVChunkPoint(
            id=str(uuid.uuid4()),
            vector=vectors[i],
            user_id=user_id,
            cv_id=cv_version_id,
            section=chunks[i].section,
            chunk_index=chunks[i].chunk_index,
            text=chunks[i].text,
            token_count=chunks[i].token_count,  # already computed by chunker, no recount needed
        )
        for i in range(len(chunks))
    ]
    await upsert_chunks(points)
    return len(points)
