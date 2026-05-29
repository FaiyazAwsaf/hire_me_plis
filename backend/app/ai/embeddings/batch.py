from app.core.embed_client import EMBED_MODEL, embed_client


async def embed_batch(texts: list[str]) -> list[list[float]]:
    """Embed multiple texts in one API call. Returns vectors in the same order as input.

    OpenAI supports up to 2048 inputs per call — a full CV produces ~50 chunks,
    well within that limit, so one call handles the entire pipeline run.
    """
    response = await embed_client.embeddings.create(
        model=EMBED_MODEL,
        input=texts,
    )
    # API does not guarantee response order matches input order — sort by index to be safe
    return [item.embedding for item in sorted(response.data, key=lambda x: x.index)]
