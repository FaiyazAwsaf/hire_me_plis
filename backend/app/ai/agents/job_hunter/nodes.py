import asyncio
import json
import logging

from app.ai.agents.fit_scorer import scorer
from app.ai.agents.job_hunter.state import JobHunterState
from app.ai.agents.job_hunter.tools.bdjobs import search_bdjobs
from app.ai.agents.job_hunter.tools.jsearch import search_jsearch
from app.ai.agents.job_hunter.tools.linkedin import search_linkedin
from app.ai.agents.job_hunter.tools.scraper import search_remotive
from app.ai.llm.generate import generate
from app.ai.llm.prompts.jobs import parse_query_prompt
from app.core.llm_client import LIGHT_MODEL

logger = logging.getLogger(__name__)


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
    """Fan-out: fetch jobs from all sources (BDJobs, LinkedIn, JSearch, Remotive) in parallel.

    All sources are primary — they all run simultaneously and contribute their results.
    Each source is independent — one failing (rate-limit, network error) doesn't
    affect the others. Results are combined from all successful sources.
    """
    role = state["role"]
    location = state["location"]
    date_from = state["date_from"]

    logger.info(f"🔍 Job search: role={role}, location={location}, date_from={date_from}")

    # All four sources launch simultaneously
    bdjobs_res, linkedin_res, jsearch_res, remotive_res = await asyncio.gather(
        search_bdjobs(role, location, date_from),
        search_linkedin(role, location, date_from),
        search_jsearch(role, location),
        search_remotive(f"{role} {location}".strip()),
        return_exceptions=True,  # one source error must not cancel the others
    )

    combined: list[dict] = []
    sources: list[str] = []

    # isinstance check distinguishes successful list results from exception objects
    if isinstance(bdjobs_res, Exception):
        logger.warning(f"BDJobs failed: {type(bdjobs_res).__name__}: {bdjobs_res}")
    elif isinstance(bdjobs_res, list):
        if bdjobs_res:
            logger.info(f"✅ BDJobs: {len(bdjobs_res)} jobs found")
            combined.extend(bdjobs_res)
            sources.append("bdjobs")
        else:
            logger.info("BDJobs: no jobs found (empty result)")

    if isinstance(linkedin_res, Exception):
        logger.warning(f"LinkedIn failed: {type(linkedin_res).__name__}: {linkedin_res}")
    elif isinstance(linkedin_res, list):
        if linkedin_res:
            logger.info(f"✅ LinkedIn: {len(linkedin_res)} jobs found")
            combined.extend(linkedin_res)
            sources.append("linkedin")
        else:
            logger.info("LinkedIn: no jobs found (empty result)")

    if isinstance(jsearch_res, Exception):
        logger.warning(f"JSearch failed: {type(jsearch_res).__name__}: {jsearch_res}")
    elif isinstance(jsearch_res, list):
        if jsearch_res:
            logger.info(f"✅ JSearch: {len(jsearch_res)} jobs found")
            combined.extend(jsearch_res)
            sources.append("jsearch")
        else:
            logger.info("JSearch: no jobs found (empty result)")

    if isinstance(remotive_res, Exception):
        logger.warning(f"Remotive failed: {type(remotive_res).__name__}: {remotive_res}")
    elif isinstance(remotive_res, list):
        if remotive_res:
            logger.info(f"✅ Remotive: {len(remotive_res)} jobs found")
            combined.extend(remotive_res)
            sources.append("remotive")
        else:
            logger.info("Remotive: no jobs found (empty result)")

    if combined:
        logger.info(f"✅ Combined {len(combined)} jobs from sources: {','.join(sources)}")
        return {"raw_jobs": combined, "source": ",".join(sources)}

    logger.warning("❌ No jobs found from any source")
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
                "source_platform": job.get("source_platform"),
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
