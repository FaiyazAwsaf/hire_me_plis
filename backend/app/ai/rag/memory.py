import json

from app.core.redis_client import redis_pool

_SESSION_TTL_SECONDS = 7200  # 2 hours
_MAX_MESSAGES = 20


async def redis_load_history(session_id: str) -> list[dict]:
    """Load the session message list from Redis. Returns [] on cache miss — never raises."""
    raw = await redis_pool.lrange(f"session:{session_id}:messages", 0, -1)
    # redis_pool has decode_responses=True so raw is list[str], no .decode() needed
    return [json.loads(m) for m in raw]


async def redis_append(
    session_id: str,
    role: str,
    content: str,
    created_at_iso: str,
) -> None:
    """Append one message to the Redis session list, trim to _MAX_MESSAGES, and reset TTL.

    created_at_iso must come from the caller so that the Postgres re-seed path preserves
    original timestamps instead of overwriting them with the current time.
    """
    key = f"session:{session_id}:messages"
    msg = json.dumps({"role": role, "content": content, "created_at": created_at_iso})
    await redis_pool.rpush(key, msg)
    # -_MAX_MESSAGES keeps only the newest 20 messages, atomically
    await redis_pool.ltrim(key, -_MAX_MESSAGES, -1)
    # Reset 2-hour expiry on every write so active sessions never expire mid-conversation
    await redis_pool.expire(key, _SESSION_TTL_SECONDS)
