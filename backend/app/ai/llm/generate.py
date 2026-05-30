from app.core.llm_client import llm_client


async def generate(prompt: str, model: str, system: str = "") -> str:
    """Single entry point for all LLM text generation — never call llm_client directly."""
    messages = []
    if system:
        # system must be first in the messages list for both Claude and Gemini
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = await llm_client.chat.completions.create(
        model=model,
        messages=messages,
    )
    return response.choices[0].message.content