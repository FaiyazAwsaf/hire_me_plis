import redis.asyncio as redis
from app.config import settings

# decode_responses=True returns str instead of bytes — required for JSON chat history
redis_pool = redis.from_url(settings.redis_url, decode_responses=True)
