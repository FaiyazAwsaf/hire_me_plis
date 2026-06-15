import json
import uuid

from app.ai.cv_pipeline.classifier import ClassifiedBlock
from app.ai.llm.generate import generate
from app.ai.llm.prompts.cv import profile_extraction_prompt
from app.core.llm_client import LIGHT_MODEL


def _build_cv_text(classified: list[ClassifiedBlock]) -> str:
    """Flatten classified blocks into labelled sections for the extraction prompt."""
    parts = [f"[{block.section.upper()}]\n{block.text}" for block in classified]
    return "\n\n".join(parts)


def _add_ids(profile: dict) -> dict:
    """Inject UUID ids into every array entry — generated here, not by the LLM."""
    for section in ("experience", "education", "projects", "certifications"):
        for entry in profile.get(section, []):
            entry["id"] = str(uuid.uuid4())
    return profile


def _strip_fences(raw: str) -> str:
    """Remove markdown code fences that some models add despite instructions."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        raw = raw.rsplit("```", 1)[0]
    return raw.strip()


async def extract_profile(classified: list[ClassifiedBlock]) -> dict:
    """Use Gemini Flash to produce a structured profile dict from classified CV blocks.

    Returns a dict matching CVProfileWrite (no updated_at). UUIDs are injected
    after parsing so the LLM is never trusted to generate them.
    """
    text = _build_cv_text(classified)
    prompt = profile_extraction_prompt(text)
    raw = await generate(prompt, model=LIGHT_MODEL)
    profile = json.loads(_strip_fences(raw))
    return _add_ids(profile)
