import asyncio
import re
from dataclasses import dataclass

from app.ai.embeddings.embed import embed_text
from app.ai.llm.generate import generate
from app.ai.llm.prompts.scoring import fit_score_explanation_prompt
from app.ai.rag.context import build_context
from app.ai.vector_store.scroll import get_user_experience_years, scroll_section_texts
from app.ai.vector_store.search import search_chunks
from app.core.llm_client import HEAVY_MODEL

from .extractor import extract_jd_skills, extract_years_required


@dataclass
class FitScoreResult:
    score: int           # 0-100 weighted total
    skill_match: int     # 0-100 Jaccard on word tokens [40%]
    semantic_match: int  # 0-100 avg cosine of top-3 experience chunks [40%]
    experience_match: int  # 0-100 linear scale against required years [20%]
    explanation: str     # 2-3 sentences from Claude, grounded in CV context


async def score(jd_text: str, user_id: str) -> FitScoreResult:
    """Compute a 0-100 fit score for a JD against the user's Qdrant CV chunks.

    Two asyncio.gather rounds: Round 1 extracts JD data in parallel; Round 2 reads
    CV data in parallel using the JD vector produced by Round 1.
    """
    # Round 1 — three independent I/O calls: 2 Gemini extractions + 1 OpenAI embedding
    jd_skills, years_required, jd_vector = await asyncio.gather(
        extract_jd_skills(jd_text),
        extract_years_required(jd_text),
        embed_text(jd_text),
    )

    # Round 2 — three Qdrant reads that all depend on jd_vector from Round 1
    cv_skills_texts, experience_results, cv_years = await asyncio.gather(
        scroll_section_texts(user_id, "skills"),
        search_chunks(jd_vector, user_id, top_k=5, section="experience"),
        get_user_experience_years(user_id),
    )

    # Skill match — Jaccard similarity on lowercase word tokens, punctuation stripped
    # Without stripping, "python," != "python" and every comma-separated skill misses
    def _tokens(texts: list[str]) -> set[str]:
        tokens = set()
        for text in texts:
            for w in text.lower().split():
                clean = re.sub(r"[^\w+#]", "", w)  # keep +/# for c++, c#
                if clean:
                    tokens.add(clean)
        return tokens

    jd_words = _tokens(jd_skills)
    cv_words = _tokens(cv_skills_texts)
    union = jd_words | cv_words
    skill_match = min(100, round(len(jd_words & cv_words) / len(union) * 100)) if union else 0

    # Semantic match — average cosine score of the top-3 experience chunks
    top3 = experience_results[:3]
    semantic_match = (
        min(100, round(sum(r.score for r in top3) / len(top3) * 100)) if top3 else 0
    )

    # Experience match — linear scale; neutral 80 when JD states no requirement
    if years_required is None:
        experience_match = 80
    elif years_required == 0:
        experience_match = 100
    else:
        experience_match = min(100, round(cv_years / years_required * 100))

    total = round(0.4 * skill_match + 0.4 * semantic_match + 0.2 * experience_match)

    # Claude Sonnet writes the explanation, grounded in actual CV context
    cv_context = build_context(experience_results)
    explanation = await generate(
        prompt=fit_score_explanation_prompt(
            score=total,
            breakdown={
                "skill_match": skill_match,
                "semantic_match": semantic_match,
                "experience_match": experience_match,
            },
            cv_context=cv_context,
            jd_summary=jd_text[:1000],  # cap to keep the prompt token-efficient
        ),
        model=HEAVY_MODEL,
    )

    return FitScoreResult(
        score=total,
        skill_match=skill_match,
        semantic_match=semantic_match,
        experience_match=experience_match,
        explanation=explanation,
    )
