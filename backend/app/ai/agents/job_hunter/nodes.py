import asyncio
import json
import logging
import re

import httpx

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
        desc = (job.get("description") or "").strip()
        if len(desc) < 50:
            logger.info(f"'{job.get('role')}' at '{job.get('company')}': short description, fetching from URL")
            desc = await _fetch_description(job.get("url", ""), job)
        try:
            result = await scorer.score(desc, user_id)
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
                "missing_skills": result.missing_skills,
            }
        except Exception as exc:
            logger.warning(
                f"score_one failed for '{job.get('role')}' at '{job.get('company')}': "
                f"{type(exc).__name__}: {exc}"
            )
            return None

    results = await asyncio.gather(*[score_one(job) for job in raw_jobs])
    job_cards = [r for r in results if r is not None]
    logger.info(f"✅ Scored {len(job_cards)}/{len(raw_jobs)} jobs successfully")
    return {"job_cards": job_cards}


async def _fetch_description(url: str, job: dict) -> str:
    """Fetch a job description from the posting URL when the scraper returned none.

    Falls back to a minimal title+company string so the scorer always gets
    something — avoids the empty-string 400 error from OpenAI embeddings.
    """
    if url:
        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
                if resp.status_code == 200:
                    text = re.sub(r"<[^>]+>", " ", resp.text)  # strip HTML tags
                    text = re.sub(r"\s+", " ", text).strip()    # collapse whitespace
                    if len(text) >= 50:
                        logger.info(f"Fetched {len(text)} chars from {url}")
                        return text[:3000]
        except Exception as exc:
            logger.debug(f"URL fetch failed for {url}: {type(exc).__name__}: {exc}")

    # Absolute fallback — title + company gives at least some semantic signal
    fallback = f"{job.get('role', '')} position at {job.get('company', '')} in {job.get('location', '')}".strip()
    logger.info(f"Using title fallback for '{job.get('role')}' at '{job.get('company')}'")
    return fallback


def _strip_fences(text: str) -> str:
    """Remove markdown code fences that LLMs add despite being told not to."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```", 2)[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.rsplit("```", 1)[0]
    return cleaned.strip()
