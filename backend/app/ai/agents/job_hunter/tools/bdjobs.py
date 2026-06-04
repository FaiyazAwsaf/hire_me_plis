import asyncio
import math
import uuid
from dataclasses import asdict

from jobspy import scrape_jobs

from app.ai.agents.job_hunter.state import RawJob


async def search_bdjobs(role: str, location: str, date_from: str | None = None) -> list[dict]:
    """Scrape BDJobs via python-jobspy wrapped in to_thread (jobspy uses requests internally)."""
    loc = location or "Bangladesh"  # BDJobs without a location returns global noise

    def _scrape() -> list[dict]:
        df = scrape_jobs(
            site_name=["bdjobs"],
            search_term=role,
            location=loc,
            results_wanted=10,
        )
        results = []
        for _, row in df.iterrows():
            results.append(asdict(RawJob(
                id=str(uuid.uuid4()),
                role=_s(row.get("title")) or role,
                company=_s(row.get("company")) or "",
                location=_s(row.get("location")) or loc,
                salary_range=_salary(row),
                deadline=None,
                url=_s(row.get("job_url")) or "",
                description=(_s(row.get("description")) or "")[:3000],
            )))
        return results

    return await asyncio.to_thread(_scrape)


def _salary(row) -> str | None:
    lo, hi = _n(row.get("min_amount")), _n(row.get("max_amount"))
    if lo is None and hi is None:
        return None
    cur = _s(row.get("currency")) or "BDT"
    return f"{cur} {lo:,.0f}–{hi:,.0f}" if (lo and hi) else f"{cur} {(lo or hi):,.0f}"


def _s(val) -> str | None:
    """Coerce a pandas cell to str, returning None for NaN or empty."""
    if val is None:
        return None
    try:
        if math.isnan(float(val)):
            return None
    except (TypeError, ValueError):
        pass
    s = str(val).strip()
    return s if s and s.lower() != "nan" else None


def _n(val) -> float | None:
    """Coerce a pandas cell to float, returning None for NaN."""
    try:
        n = float(val)
        return None if math.isnan(n) else n
    except (TypeError, ValueError):
        return None
