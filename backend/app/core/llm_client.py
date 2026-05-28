from openai import AsyncOpenAI
from app.config import settings

# Change model constants here to affect every call site
HEAVY_MODEL = "claude-sonnet-4-6"   # Claude — explanations, cover letters, fit reasoning
LIGHT_MODEL = "gemini-flash"         # Gemini Flash — classification, extraction (fast + cheap)

llm_client = AsyncOpenAI(
    api_key=settings.chatllm_api_key,
    base_url=settings.chatllm_base_url,
)
