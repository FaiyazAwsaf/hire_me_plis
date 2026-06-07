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

# Abbreviations a user might write in their own CV that the JD prompt won't produce.
# Applied only to CV text (JD skills come pre-normalized from the extraction prompt).
_CV_ABBREV: list[tuple[str, str]] = [
    (r"\bml\b",    "machine learning"),
    (r"\bdl\b",    "deep learning"),
    (r"\bai\b",    "artificial intelligence"),
    (r"\bnlp\b",   "natural language processing"),
    (r"\bcv\b",    "computer vision"),
    (r"\bllm\b",   "large language model"),
    (r"\bjs\b",    "javascript"),
    (r"\bts\b",    "typescript"),
    (r"\bk8s\b",   "kubernetes"),
    (r"\baws\b",   "amazon web services"),
    (r"\bgcp\b",   "google cloud platform"),
    (r"\btf\b",    "tensorflow"),
    (r"\bpt\b",    "pytorch"),
    (r"\bpostgres\b", "postgresql"),
    (r"\boop\b",   "object oriented programming"),
    (r"\bdsa\b",   "data structures algorithms"),
    (r"\breactjs\b",  "react"),
    (r"\bnodejs\b",   "node"),
]


def _normalize_cv(text: str) -> str:
    """Expand abbreviations in raw CV text so they match the canonical forms the JD prompt returns."""
    t = text.lower()
    for pattern, expansion in _CV_ABBREV:
        t = re.sub(pattern, expansion, t)
    return t


@dataclass
class FitScoreResult:
    score: int                   # 0-100 weighted total
    skill_match: int             # 0-100 recall: % of JD skills in CV [30%]
    semantic_match: int          # 0-100 avg cosine of top-5 chunks across all sections [50%]
    experience_match: int        # 0-100 linear scale against required years [20%]
    explanation: str             # 2-3 sentences from Claude, grounded in CV context
    missing_skills: list[str]    # JD-required skills absent from the CV skills section


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

    # Round 2 — all Qdrant reads in parallel, depend on jd_vector from Round 1
    (cv_skills_texts, cv_exp_texts, cv_proj_texts), semantic_results, cv_years = await asyncio.gather(
        # Scroll three sections in parallel — skills listed explicitly + skills demonstrated
        # in experience/projects descriptions (e.g. "NLP" in a project, "SQL" in a role)
        asyncio.gather(
            scroll_section_texts(user_id, "skills"),
            scroll_section_texts(user_id, "experience"),
            scroll_section_texts(user_id, "projects"),
        ),
        search_chunks(jd_vector, user_id, top_k=5),  # semantic scoring — all sections
        get_user_experience_years(user_id),
    )
    # Combine all three sections — union of every skill signal across the CV
    cv_all_texts = cv_skills_texts + cv_exp_texts + cv_proj_texts

    # Skill match — recall: what % of JD-required skills appear anywhere in the CV
    # Uses recall (intersection/jd_words), not Jaccard — asks "does the CV cover the JD?"
    # rather than "how similar are the two skill sets?", which unfairly penalises larger CVs.
    def _tokens(texts: list[str], normalize: bool = False) -> set[str]:
        tokens = set()
        for text in texts:
            # normalize=True only for CV text — JD skills are already canonical from the prompt
            source = _normalize_cv(text) if normalize else text.lower()
            for w in source.split():
                # Split on "/" first so "PL/SQL" → ["pl", "sql"] not ["plsql"]
                for part in re.split(r"/", w):
                    clean = re.sub(r"[^\w+#]", "", part)  # keep +/# for c++, c#
                    if clean:
                        tokens.add(clean)
        return tokens

    jd_words = _tokens(jd_skills)                       # prompt guarantees canonical full forms
    cv_words = _tokens(cv_all_texts, normalize=True)    # expand abbreviations, cover all sections
    skill_match = min(100, round(len(jd_words & cv_words) / len(jd_words) * 100)) if jd_words else 0

    # Missing skills — JD skill names where none of their tokens appear anywhere in the CV
    missing_skills = [
        skill for skill in jd_skills
        if not any(
            part in cv_words
            for w in skill.split()
            for part in [re.sub(r"[^\w+#]", "", w.lower())]
            if part
        )
    ]

    # Semantic match — average of top-5 chunks across ALL sections (experience + projects + skills)
    # +7 bias corrects for OpenAI embeddings' natural cosine ceiling (~0.85 for well-matched docs)
    if semantic_results:
        semantic_avg = sum(r.score for r in semantic_results) / len(semantic_results)
        semantic_match = min(100, round(semantic_avg * 100) + 10)
    else:
        semantic_match = 0

    # Experience match — linear scale; neutral 80 when JD states no requirement
    if years_required is None:
        experience_match = 80
    elif years_required == 0:
        experience_match = 100
    else:
        experience_match = min(100, round(cv_years / years_required * 100))

    total = round(0.3 * skill_match + 0.5 * semantic_match + 0.2 * experience_match)

    # Claude Sonnet writes the explanation grounded in the top-5 most relevant CV chunks
    cv_context = build_context(semantic_results)
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
        missing_skills=missing_skills,
    )
