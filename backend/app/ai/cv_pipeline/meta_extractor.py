import json
from dataclasses import dataclass

from app.ai.cv_pipeline.classifier import ClassifiedBlock
from app.ai.llm.generate import generate
from app.ai.llm.prompts.cv import cv_meta_prompt
from app.core.llm_client import LIGHT_MODEL


@dataclass
class CVMeta:
    role_title: str       # most recent job title — enables role-based filtering in Qdrant
    experience_years: int  # total years of experience — enables range queries (gte=3)


async def extract_cv_meta(classified: list[ClassifiedBlock]) -> CVMeta:
    """Extract structured candidate metadata from the experience section using Gemini Flash.

    Stamps every Qdrant chunk with role_title + experience_years so the job-hunting
    agent can pre-filter by level before doing semantic search.
    Returns safe defaults if no experience section exists or LLM output is unparseable.
    """
    experience_blocks = [b for b in classified if b.section == "experience"]

    if not experience_blocks:
        return CVMeta(role_title="", experience_years=0)

    experience_text = "\n\n".join(b.text for b in experience_blocks)
    prompt = cv_meta_prompt(experience_text)

    try:
        raw = await generate(prompt=prompt, model=LIGHT_MODEL)
        cleaned = raw.strip()
        # Strip markdown code fences — LLMs sometimes wrap JSON in ```json``` despite instructions
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```", 2)[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.rsplit("```", 1)[0]
        data = json.loads(cleaned.strip())
        return CVMeta(
            role_title=str(data.get("role_title", "")),
            experience_years=int(data.get("experience_years", 0)),
        )
    except Exception:
        # Metadata extraction failure must never abort the ingestion pipeline
        return CVMeta(role_title="", experience_years=0)
