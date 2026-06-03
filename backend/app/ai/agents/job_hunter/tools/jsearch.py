import uuid
from dataclasses import asdict

import httpx

from app.ai.agents.job_hunter.state import RawJob
from app.config import settings

_JSEARCH_URL = "https://jsearch.p.rapidapi.com/search"


async def search_jsearch(role: str, location: str) -> list[dict]:
    """Query JSearch RapidAPI (aggregates LinkedIn, Indeed, Glassdoor) via async httpx."""
    query = f"{role} in {location}" if location else role
    headers = {
        "X-RapidAPI-Key": settings.jsearch_rapidapi_key,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    }
    params = {"query": query, "page": "1", "num_pages": "1"}

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(_JSEARCH_URL, headers=headers, params=params)
        resp.raise_for_status()
        data = resp.json()

    results = []
    for item in data.get("data", [])[:5]:
        lo = item.get("job_min_salary")
        hi = item.get("job_max_salary")
        cur = item.get("job_salary_currency") or "USD"
        salary = f"{cur} {lo:,.0f}–{hi:,.0f}" if (lo and hi) else None

        city = item.get("job_city") or ""
        country = item.get("job_country") or ""
        loc = f"{city}, {country}".strip(", ") if city else country

        results.append(asdict(RawJob(
            id=str(uuid.uuid4()),
            role=item.get("job_title") or "",
            company=item.get("employer_name") or "",
            location=loc,
            salary_range=salary,
            deadline=None,
            url=item.get("job_apply_link") or "",
            description=(item.get("job_description") or "")[:3000],
        )))
    return results
