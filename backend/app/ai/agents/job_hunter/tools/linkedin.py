import asyncio
import logging
import math
import uuid
from dataclasses import asdict

from jobspy import scrape_jobs

from app.ai.agents.job_hunter.state import RawJob

logger = logging.getLogger(__name__)


async def search_linkedin(role: str, location: str, date_from: str | None = None) -> list[dict]:
    """Scrape LinkedIn via python-jobspy wrapped in to_thread (jobspy uses requests internally)."""

    def _scrape() -> list[dict]:
        try:
            kwargs: dict = dict(
                site_name=["linkedin"],
                search_term=role,
                results_wanted=10,
            )
            if location:
                kwargs["location"] = location
            df = scrape_jobs(**kwargs)
            logger.info(f"LinkedIn scrape returned {len(df)} rows for '{role}' in '{location or 'global'}'")
            results = []
            for _, row in df.iterrows():
                results.append(asdict(RawJob(
                    id=str(uuid.uuid4()),
                    role=_s(row.get("title")) or role,
                    company=_s(row.get("company")) or "",
                    location=_s(row.get("location")) or location or "",
                    salary_range=_salary(row),
                    deadline=None,
                    url=_s(row.get("job_url")) or "",
                    description=(_s(row.get("description")) or "")[:3000],
                )))
            logger.info(f"LinkedIn converted {len(results)} valid jobs")
            return results
        except Exception as e:
            logger.exception(f"LinkedIn scrape error: {type(e).__name__}: {e}")
            raise

    return await asyncio.to_thread(_scrape)


def _salary(row) -> str | None:
    lo, hi = _n(row.get("min_amount")), _n(row.get("max_amount"))
    if lo is None and hi is None:
        return None
    cur = _s(row.get("currency")) or "USD"
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
