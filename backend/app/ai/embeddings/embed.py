from app.ai.embeddings.batch import embed_batch


async def embed_text(text: str) -> list[float]:
    """Embed a single string. Used for query embedding at search time."""
    vectors = await embed_batch([text])
    return vectors[0]
