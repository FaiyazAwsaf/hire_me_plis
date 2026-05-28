from openai import AsyncOpenAI
from app.config import settings

EMBED_MODEL = "text-embedding-3-small"
EMBED_DIM = 1536

embed_client = AsyncOpenAI(api_key=settings.openai_api_key)
