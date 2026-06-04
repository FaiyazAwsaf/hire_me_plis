import asyncio
import logging
import uuid
from dataclasses import asdict

import httpx

from app.ai.agents.job_hunter.state import RawJob
from app.config import settings

logger = logging.getLogger(__name__)

_JSEARCH_URL = "https://api.openwebninja.com/jsearch/search"
_NUM_PAGES = 2  # Fetch 2 pages to get up to ~10 results
_TARGET = 10


async def search_jsearch(role: str, location: str) -> list[dict]:
    """Query JSearch API (OpenWebNinja) across multiple pages to collect up to 10 results."""
    if not settings.jsearch_api_key:
        raise ValueError("JSearch API key not configured. Set JSEARCH_API_KEY in .env")

    query = f"{role} jobs in {location}" if location else f"{role} jobs"
    headers = {"x-api-key": settings.jsearch_api_key}
    results = []

    async with httpx.AsyncClient(timeout=15.0) as client:
        for page in range(1, _NUM_PAGES + 1):
            if len(results) >= _TARGET:
                break
            try:
                params = {"query": query, "page": str(page), "num_pages": "1"}
                resp = await client.get(_JSEARCH_URL, headers=headers, params=params)
                resp.raise_for_status()
                items = resp.json().get("data", [])
                logger.info(f"JSearch page {page} returned {len(items)} items for '{query}'")

                if not items:
                    break  # No more results

                for item in items:
                    if len(results) >= _TARGET:
                        break
                    lo = item.get("job_min_salary")
                    hi = item.get("job_max_salary")
                    try:
                        salary = f"${int(lo):,}–${int(hi):,}" if (lo and hi) else None
                    except (ValueError, TypeError):
                        salary = None

                    results.append(asdict(RawJob(
                        id=str(uuid.uuid4()),
                        role=item.get("job_title") or "",
                        company=item.get("employer_name") or "",
                        location=item.get("job_location") or "",
                        salary_range=salary,
                        deadline=None,
                        url=item.get("job_apply_link") or "",
                        description=(item.get("job_description") or "")[:3000],
                    )))

                if page < _NUM_PAGES:
                    await asyncio.sleep(1)  # Rate limiting between pages

            except Exception as e:
                logger.warning(f"JSearch page {page} failed: {type(e).__name__}: {e}")
                break

    logger.info(f"JSearch collected {len(results)} jobs total")
    return results
