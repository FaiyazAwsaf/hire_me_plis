import re
import uuid
from dataclasses import asdict

import httpx

from app.ai.agents.job_hunter.state import RawJob

_REMOTIVE_URL = "https://remotive.com/api/remote-jobs"


async def search_remotive(query: str) -> list[dict]:
    """Fetch remote jobs from Remotive's public API (no key required — last-resort fallback)."""
    params = {"search": query, "limit": 10}

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(_REMOTIVE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    results = []
    for item in data.get("jobs", []):
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
    return results


def _strip_html(text: str) -> str:
    """Remove HTML tags from Remotive job descriptions."""
    return re.sub(r"<[^>]+>", " ", text).strip()
