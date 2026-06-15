import json
import logging

from app.ai.llm.generate import generate
from app.ai.llm.prompts.scoring import skill_extraction_prompt, years_extraction_prompt
from app.core.llm_client import LIGHT_MODEL

logger = logging.getLogger(__name__)


async def extract_jd_skills(jd_text: str) -> list[str]:
    """Extract required skills from a JD as a list of strings using Gemini Flash.

    Returns [] on any parse failure — scorer treats empty skills as 0 skill match,
    which is safe and explicit rather than a crash.
    """
    prompt = skill_extraction_prompt(jd_text)
    try:
        raw = await generate(prompt=prompt, model=LIGHT_MODEL)
        return json.loads(_strip_fences(raw))
    except Exception as exc:
        logger.warning(f"extract_jd_skills failed ({type(exc).__name__}: {exc})")
        return []


async def extract_years_required(jd_text: str) -> int | None:
    """Extract the minimum years of experience required from a JD using Gemini Flash.

    Returns None if not stated — scorer uses 80/100 as a neutral default in that case.
    Returns None on any parse failure for the same reason.
    """
    prompt = years_extraction_prompt(jd_text)
    try:
        raw = await generate(prompt=prompt, model=LIGHT_MODEL)
        data = json.loads(_strip_fences(raw))
        return data.get("years_required")  # None if key missing or explicitly null
    except Exception as exc:
        logger.warning(f"extract_years_required failed ({type(exc).__name__}: {exc})")
        return None


def _strip_fences(text: str) -> str:
    """Remove markdown code fences that LLMs add despite being told not to."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```", 2)[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.rsplit("```", 1)[0]
    return cleaned.strip()
