import uuid
from collections.abc import AsyncGenerator
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm.prompts.rag import rag_system_prompt
from app.ai.llm.stream import stream_chat
from app.ai.rag.context import build_context
from app.ai.rag.memory import redis_append, redis_load_history
from app.ai.rag.retriever import retrieve
from app.core.llm_client import HEAVY_MODEL
from app.models.chat_message import ChatMessage


async def save_message(
    session_id: str,
    user_id: str,
    role: str,
    content: str,
    db: AsyncSession,
) -> str:
    """Write a chat message to Postgres (durable) then Redis (cache).

    Postgres-first: data is safe even if the Redis write fails.
    Returns the created_at ISO string so the caller can pass it to redis_append
    without a separate DB refresh — we generate the timestamp in Python once.
    """
    now = datetime.now(timezone.utc)
    created_at_iso = now.isoformat()

    db.add(
        ChatMessage(
            user_id=uuid.UUID(user_id),
            session_id=session_id,
            role=role,
            content=content,
            created_at=now,
        )
    )
    await db.commit()

    await redis_append(session_id, role, content, created_at_iso)
    return created_at_iso


async def load_history(
    session_id: str,
    user_id: str,
    db: AsyncSession,
    limit: int = 20,
) -> list[dict]:
    """Return message history: Redis fast path or Postgres fallback.

    On a Redis cache miss (TTL expired), reads from Postgres and re-seeds Redis
    so the rest of the session stays on the fast path.
    """
    # Fast path — 90%+ of in-session requests hit this
    cached = await redis_load_history(session_id)
    if cached:
        return cached[-limit:]

    # Cache miss — user returned after 2-hour TTL expiry
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == uuid.UUID(user_id))
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
        .limit(limit)
    )
    messages = result.scalars().all()

    # Re-seed Redis with original timestamps so the session timeline is preserved
    for m in messages:
        await redis_append(session_id, m.role, m.content, m.created_at.isoformat())

    return [
        {"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()}
        for m in messages
    ]


async def handle_chat(
    user_id: str,
    session_id: str,
    user_message: str,
    db: AsyncSession,
) -> AsyncGenerator[str, None]:
    """Full RAG chat pipeline — yields tokens as they stream from the LLM.

    Step order is intentional: user message saved before load_history so the
    current turn is included in context. Assistant message saved after the last
    yield so the complete response is written atomically.
    """
    # 1. Persist user message — Postgres + Redis
    await save_message(session_id, user_id, "user", user_message, db)

    # 2. Load history (now includes the just-saved user message)
    history = await load_history(session_id, user_id, db)

    # 3. Retrieve top-5 CV chunks most relevant to this specific question
    results = await retrieve(user_message, user_id, top_k=5)
    context = build_context(results)

    # 4. Assemble the full messages array: system prompt + conversation history
    system_prompt = rag_system_prompt(context)
    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    # 5. Stream tokens, accumulate the full response for saving
    assembled: list[str] = []
    async for token in stream_chat(messages, HEAVY_MODEL):
        assembled.append(token)
        yield token

    # 6. Persist the complete assistant response — runs after the last yield
    await save_message(session_id, user_id, "assistant", "".join(assembled), db)
