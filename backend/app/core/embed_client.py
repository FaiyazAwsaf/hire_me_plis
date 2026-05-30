from openai import AsyncOpenAI
from app.config import settings

EMBED_MODEL = "text-embedding-3-small"
EMBED_DIM = 1536

# Separate from llm_client: embeddings use the real OpenAI API directly,
# not the ChatLLM proxy, so they need their own key and default base_url.
embed_client = AsyncOpenAI(api_key=settings.openai_api_key)
