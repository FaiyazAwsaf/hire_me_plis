import logging
import re
import uuid
from dataclasses import asdict

import httpx

from app.ai.agents.job_hunter.state import RawJob

logger = logging.getLogger(__name__)

_REMOTIVE_URL = "https://remotive.com/api/remote-jobs"


async def search_remotive(query: str) -> list[dict]:
    """Fetch remote jobs from Remotive's public API (no key required — last-resort fallback)."""
    params = {"search": query, "limit": 10}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(_REMOTIVE_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
        logger.info(f"Remotive API returned {len(data.get('jobs', []))} jobs for '{query}'")
    except Exception as e:
        logger.exception(f"Remotive API error: {type(e).__name__}: {e}")
        raise

    results = []
    for item in data.get("jobs", [])[:10]:  # Cap at 10 results to match other sources
        results.append(asdict(RawJob(
            id=str(uuid.uuid4()),
            role=item.get("title") or "",
            company=item.get("company_name") or "",
            location=item.get("candidate_required_location") or "Remote",
            salary_range=item.get("salary") or None,
            deadline=None,
            url=item.get("url") or "",
            # Strip HTML before passing to the fit scorer — embedding raw tags adds noise
            description=_strip_html(item.get("description") or "")[:3000],
        )))
    logger.info(f"Remotive converted {len(results)} valid jobs (capped at 10)")
    return results


def _strip_html(text: str) -> str:
    """Remove HTML tags from Remotive job descriptions."""
    return re.sub(r"<[^>]+>", " ", text).strip()
