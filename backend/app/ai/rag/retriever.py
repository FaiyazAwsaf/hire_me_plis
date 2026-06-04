from app.ai.embeddings.embed import embed_text
from app.ai.vector_store.search import SearchResult, search_chunks


async def retrieve(
    query: str,
    user_id: str,
    top_k: int = 5,
) -> list[SearchResult]:
    """Embed the query then search Qdrant for the top-k most relevant CV chunks.

    This is the mock boundary in tests — mock embed_text and search_chunks here
    rather than hitting OpenAI or Qdrant.
    """
    # TODO: add cross-encoder reranking here when retrieval quality becomes a bottleneck
    vector = await embed_text(query)
    return await search_chunks(vector, user_id, top_k)
