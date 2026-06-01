from collections.abc import AsyncGenerator

from app.core.llm_client import llm_client


async def stream_chat(
    messages: list[dict],
    model: str,
) -> AsyncGenerator[str, None]:
    """Yield LLM response tokens one by one from a pre-assembled messages array.

    Takes the full messages list (system + history + current user turn) rather than
    a prompt string — multi-turn chat can't be expressed as a flat prompt/system pair.
    """
    response = await llm_client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True,
    )
    async for chunk in response:
        delta = chunk.choices[0].delta.content
        # Final stop chunk always has content=None — guard required
        if delta is not None:
            yield delta
