import json
import logging

from app.ai.embeddings.embed import embed_text
from app.ai.llm.generate import generate
from app.ai.llm.prompts.rag import query_intent_system_prompt
from app.ai.vector_store.scroll import scroll_section_texts
from app.ai.vector_store.search import SearchResult, search_chunks
from app.core.llm_client import LIGHT_MODEL

logger = logging.getLogger(__name__)

# All section names that are valid in the Qdrant payload — must match what the CV pipeline stamps
_VALID_SECTIONS = frozenset(
    {"experience", "education", "skills", "projects", "certifications", "personal", "summary"}
)


async def _classify_intent(query: str) -> tuple[str, str | None]:
    """Classify query intent using Gemini Flash.

    Returns a (intent, section) tuple:
    - ("enumerate_section", "projects") — user wants all items from a CV section
    - ("semantic_search", None)         — user has a reasoning/analysis question

    Never raises — any LLM or parse failure falls back to semantic_search so the
    pipeline degrades gracefully rather than breaking.
    """
    try:
        raw = await generate(query, LIGHT_MODEL, system=query_intent_system_prompt())
        data = json.loads(raw)
        intent = data.get("intent", "semantic_search")
        section = data.get("section")
        if intent == "enumerate_section" and section in _VALID_SECTIONS:
            return "enumerate_section", section
        return "semantic_search", None
    except Exception:
        # LLM failure or invalid JSON — degrade to vector search, never crash
        logger.warning("Intent classification failed, falling back to semantic_search", exc_info=True)
        return "semantic_search", None


async def retrieve(
    query: str,
    user_id: str,
    top_k: int = 5,
) -> list[SearchResult]:
    """Return the most relevant CV chunks for a query.

    Routes based on Gemini Flash intent classification:
    - enumerate_section → scroll_section_texts (full recall, no vector needed)
    - semantic_search   → embed + cosine similarity top-k (relevance-ranked)

    This is the mock boundary in tests — mock _classify_intent, embed_text, and
    search_chunks here rather than hitting external services.
    """
    intent, section = await _classify_intent(query)

    if intent == "enumerate_section" and section:
        # scroll returns every chunk in the section — guaranteed full recall
        texts = await scroll_section_texts(user_id, section)
        return [
            SearchResult(text=t, section=section, score=1.0, chunk_index=i)
            for i, t in enumerate(texts)
        ]

    # TODO: add cross-encoder reranking here when retrieval quality becomes a bottleneck
    vector = await embed_text(query)
    return await search_chunks(vector, user_id, top_k)
