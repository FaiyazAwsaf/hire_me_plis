from app.ai.vector_store.search import SearchResult


def build_context(results: list[SearchResult]) -> str:
    """Format retrieved CV chunks into a context string for the system prompt.

    Each chunk is prefixed with its section label in brackets so the LLM knows
    which part of the CV the text came from (e.g. [experience], [skills]).
    Returns "" if results is empty — callers check truthiness, not length.
    """
    if not results:
        return ""
    parts = [f"[{r.section}]\n{r.text}" for r in results]
    return "\n\n".join(parts)
