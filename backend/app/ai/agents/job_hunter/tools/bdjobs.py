import asyncio
import logging
import re
import uuid
from dataclasses import asdict
from datetime import datetime

import httpx

from app.ai.agents.job_hunter.state import RawJob

logger = logging.getLogger(__name__)

_SEARCH_URL = "https://gateway.bdjobs.com/recruitment-account-test/api/JobSearch/GetJobSearch"
_DETAILS_URL = "https://gateway.bdjobs.com/ActtivejobsTest/api/JobSubsystem/jobDetails"
_JOB_PAGE_URL = "https://bdjobs.com/h/details/{job_id}?ln=1"
_TARGET = 20
# BDJobs rate-limits concurrent detail calls — cap parallel requests to avoid ConnectTimeout
_DETAIL_CONCURRENCY = 3

# Mimic a browser — BDJobs' Angular SPA uses these headers
_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Referer": "https://jobs.bdjobs.com/",
    "Accept": "application/json, text/plain, */*",
}

# Deadline formats returned by the API ("Jul 10, 2026", "10 Jul 2026", "10-Jul-2026")
_DEADLINE_FORMATS = ["%b %d, %Y", "%d %b %Y", "%d-%b-%Y", "%d/%m/%Y"]


async def search_bdjobs(role: str, location: str, date_from: str | None = None) -> list[dict]:
    """Search BDJobs via their internal REST gateway API (reverse-engineered from Angular SPA).

    Two-phase: search endpoint returns job IDs → parallel jobDetails calls return full data.
    No jobspy / no asyncio.to_thread / no HTML parsing.
    """
    async with httpx.AsyncClient(headers=_HEADERS, timeout=15.0) as client:
        job_ids = await _search_job_ids(client, role)
        if not job_ids:
            logger.info("BDJobs: no job IDs returned from search")
            return []

        logger.info(f"BDJobs: fetching details for {len(job_ids)} job IDs")
        sem = asyncio.Semaphore(_DETAIL_CONCURRENCY)

        async def _guarded(jid: str):
            async with sem:
                return await _fetch_detail(client, jid)

        raw_details = await asyncio.gather(
            *[_guarded(jid) for jid in job_ids],
            return_exceptions=True,
        )

    results = []
    for item in raw_details:
        if isinstance(item, Exception):
            logger.warning(f"BDJobs detail fetch failed: {type(item).__name__}: {item}")
            continue
        if item is None:
            continue
        results.append(asdict(RawJob(
            id=str(uuid.uuid4()),
            role=item.get("JobTitle") or role,
            company=item.get("CompnayName") or "",  # API has a typo: "Compnay"
            location=item.get("JobLocation") or location or "Bangladesh",
            salary_range=_salary(item),
            deadline=_parse_deadline(item.get("Deadline")),
            url=_JOB_PAGE_URL.format(job_id=item.get("JobId", "")),
            description=_strip_html(item.get("JobDescription") or "")[:3000],
            source_platform="bdjobs",
        )))

    logger.info(f"BDJobs: {len(results)} jobs ready")
    return results


async def _search_job_ids(client: httpx.AsyncClient, role: str) -> list[str]:
    """Hit the GetJobSearch endpoint and return up to _TARGET job IDs."""
    try:
        resp = await client.get(_SEARCH_URL, params={
            "isPro": "1",
            "rpp": str(_TARGET * 2),  # fetch double to have room after any client-side filtering
            "pg": "1",
            "keyword": role,
        })
        resp.raise_for_status()
        data = resp.json()

        if data.get("statuscode") != "1":
            logger.warning(f"BDJobs search returned statuscode={data.get('statuscode')}")
            return []

        # Regular listings + premium listings are in separate arrays
        jobs = data.get("data", []) + data.get("premiumData", [])
        ids = [str(j["Jobid"]) for j in jobs if j.get("Jobid")]
        logger.info(f"BDJobs search: {data['common'].get('total_records_found', '?')} total, using first {len(ids[:_TARGET])}")
        return ids[:_TARGET]

    except Exception as exc:
        logger.warning(f"BDJobs search failed: {type(exc).__name__}: {exc}")
        return []


async def _fetch_detail(client: httpx.AsyncClient, job_id: str) -> dict | None:
    """Fetch full structured job data from the jobDetails endpoint."""
    try:
        resp = await client.get(_DETAILS_URL, params={"jobId": job_id})
        resp.raise_for_status()
        data = resp.json()
        # statuscode "0" means success for this endpoint (opposite convention from search)
        if data.get("statuscode") == "0" and data.get("data"):
            return data["data"][0]
        return None
    except Exception as exc:
        logger.debug(f"BDJobs detail {job_id} failed: {type(exc).__name__}: {exc}")
        raise  # re-raise so gather can log it at the call site


def _salary(item: dict) -> str | None:
    """Build a salary string from jobDetails fields."""
    # Prefer the pre-formatted range text if present and non-trivial
    range_str = (item.get("JobSalaryRange") or "").strip()
    if range_str and range_str.lower() not in ("", "0", "negotiable"):
        return range_str
    if range_str.lower() == "negotiable":
        return "Negotiable"
    lo = item.get("JobSalaryMinSalary") or 0
    hi = item.get("JobSalaryMaxSalary") or 0
    if lo and hi and lo != hi:
        return f"BDT {int(lo):,}–{int(hi):,}"
    if lo or hi:
        return f"BDT {int(lo or hi):,}"
    return None


def _parse_deadline(raw: str | None) -> str | None:
    """Parse BDJobs deadline string ("Jul 10, 2026") to ISO date string ("2026-07-10")."""
    if not raw:
        return None
    for fmt in _DEADLINE_FORMATS:
        try:
            return datetime.strptime(raw.strip(), fmt).date().isoformat()
        except (ValueError, TypeError):
            continue
    return None


def _strip_html(text: str) -> str:
    """Remove HTML tags — same approach as scraper.py."""
    return re.sub(r"<[^>]+>", " ", text).strip()
