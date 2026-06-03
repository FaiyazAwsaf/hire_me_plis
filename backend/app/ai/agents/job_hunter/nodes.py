import asyncio
import json

from app.ai.agents.fit_scorer import scorer
from app.ai.agents.job_hunter.state import JobHunterState
from app.ai.agents.job_hunter.tools.bdjobs import search_bdjobs
from app.ai.agents.job_hunter.tools.jsearch import search_jsearch
from app.ai.agents.job_hunter.tools.linkedin import search_linkedin
from app.ai.agents.job_hunter.tools.scraper import search_remotive
from app.ai.llm.generate import generate
from app.ai.llm.prompts.jobs import parse_query_prompt
from app.core.llm_client import LIGHT_MODEL


async def parse_query_node(state: JobHunterState) -> dict:
    """Use Gemini Flash to extract role, location, and date_from from the raw query string."""
    query = state["query"]
    try:
        raw = await generate(parse_query_prompt(query), model=LIGHT_MODEL)
        parsed = json.loads(_strip_fences(raw))
        return {
            "role": parsed.get("role") or query,
            "location": parsed.get("location") or "",
            "date_from": parsed.get("date_from"),
        }
    except Exception:
        # Malformed JSON from the LLM — treat the full query as the role
        return {"role": query, "location": "", "date_from": None}


async def search_node(state: JobHunterState) -> dict:
    """Fan-out: fetch up to 5 jobs from BDJobs, LinkedIn, and JSearch in parallel.

    Each source is independent — one failing (rate-limit, network error) doesn't
    affect the others. Falls back to Remotive only if all three return empty.
    """
    role = state["role"]
    location = state["location"]
    date_from = state["date_from"]

    # All three primary sources launch simultaneously
    bdjobs_res, linkedin_res, jsearch_res = await asyncio.gather(
        search_bdjobs(role, location, date_from),
        search_linkedin(role, location, date_from),
        search_jsearch(role, location),
        return_exceptions=True,  # one source error must not cancel the other two
    )

    combined: list[dict] = []
    sources: list[str] = []

    # isinstance check distinguishes successful list results from exception objects
    if isinstance(bdjobs_res, list) and bdjobs_res:
        combined.extend(bdjobs_res)
        sources.append("bdjobs")

    if isinstance(linkedin_res, list) and linkedin_res:
        combined.extend(linkedin_res)
        sources.append("linkedin")

    if isinstance(jsearch_res, list) and jsearch_res:
        combined.extend(jsearch_res)
        sources.append("jsearch")

    if combined:
        return {"raw_jobs": combined, "source": ",".join(sources)}

    # Last resort — Remotive is remote-only but better than returning nothing
    try:
        remotive_res = await search_remotive(f"{role} {location}".strip())
        if remotive_res:
            return {"raw_jobs": remotive_res, "source": "remotive"}
    except Exception:
        pass

    return {"raw_jobs": [], "source": "none"}


async def score_node(state: JobHunterState) -> dict:
    """Score all raw jobs against the user's CV in parallel via asyncio.gather.

    Without gather: N jobs × ~3s per score = ~30s total.
    With gather: all scores run concurrently, total latency ≈ slowest single score (~3s).
    """
    raw_jobs = state["raw_jobs"]
    user_id = state["user_id"]

    if not raw_jobs:
        return {"job_cards": []}

    async def score_one(job: dict) -> dict | None:
        try:
            result = await scorer.score(job["description"], user_id)
            return {
                "id": job["id"],
                "role": job["role"],
                "company": job["company"],
                "location": job["location"],
                "salary_range": job.get("salary_range"),
                "deadline": job.get("deadline"),
                "url": job["url"],
                "fit_score": result.score,
                "fit_reasoning": result.explanation,
            }
        except Exception:
            # One job failing scoring should never kill the whole batch
            return None

    results = await asyncio.gather(*[score_one(job) for job in raw_jobs])
    job_cards = [r for r in results if r is not None]
    return {"job_cards": job_cards}


def _strip_fences(text: str) -> str:
    """Remove markdown code fences that LLMs add despite being told not to."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```", 2)[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.rsplit("```", 1)[0]
    return cleaned.strip()
