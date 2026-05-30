import json
from dataclasses import dataclass

from app.ai.llm.generate import generate
from app.ai.llm.prompts.cv import section_classifier_prompt
from app.core.llm_client import LIGHT_MODEL


@dataclass
class ClassifiedBlock:
    section: str  # experience | education | skills | projects | certifications | personal | summary
    text: str


async def classify_sections(blocks: list[str]) -> list[ClassifiedBlock]:
    """Classify raw text blocks into CV sections using Gemini Flash."""
    combined = "\n\n".join(blocks)
    prompt = section_classifier_prompt(combined)
    raw = await generate(prompt=prompt, model=LIGHT_MODEL)

    # Strip markdown code fences — LLMs often wrap JSON in ```json``` despite instructions
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```", 2)[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.rsplit("```", 1)[0]

    classified = json.loads(cleaned.strip())
    return [
        ClassifiedBlock(section=item["section"], text=item["text"])
        for item in classified
    ]
