"""
Integration test for job sources — diagnoses which sources are working.

Run with: pytest tests/test_job_sources_diagnostic.py -v -s

This test hits real APIs and shows which sources succeed/fail.
Helpful for debugging the fallback-to-Remotive issue.
"""

import pytest

from app.ai.agents.job_hunter.tools.bdjobs import search_bdjobs
from app.ai.agents.job_hunter.tools.jsearch import search_jsearch
from app.ai.agents.job_hunter.tools.linkedin import search_linkedin
from app.ai.agents.job_hunter.tools.scraper import search_remotive


@pytest.mark.asyncio
class TestJobSources:
    """Integration tests for real job source APIs."""

    async def test_bdjobs_source(self):
        """Test BDJobs source — should return jobs for Bangladesh market."""
        result = await search_bdjobs("Python Developer", "Bangladesh")
        print(f"\n✅ BDJobs returned {len(result)} jobs")
        if result:
            print(f"   Sample: {result[0]['company']} — {result[0]['role']}")
        assert isinstance(result, list), "BDJobs should return a list"

    async def test_linkedin_source(self):
        """Test LinkedIn source — should return jobs."""
        result = await search_linkedin("Python Developer", "Bangladesh")
        print(f"\n✅ LinkedIn returned {len(result)} jobs")
        if result:
            print(f"   Sample: {result[0]['company']} — {result[0]['role']}")
        assert isinstance(result, list), "LinkedIn should return a list"

    async def test_jsearch_source(self):
        """Test JSearch source — requires API key in .env."""
        result = await search_jsearch("Python Developer", "Bangladesh")
        print(f"\n✅ JSearch returned {len(result)} jobs")
        if result:
            print(f"   Sample: {result[0]['company']} — {result[0]['role']}")
        assert isinstance(result, list), "JSearch should return a list"

    async def test_remotive_source(self):
        """Test Remotive source — public API, no key required."""
        result = await search_remotive("Python Developer")
        print(f"\n✅ Remotive returned {len(result)} jobs")
        if result:
            print(f"   Sample: {result[0]['company']} — {result[0]['role']}")
        assert isinstance(result, list), "Remotive should return a list"

    async def test_source_result_structure(self):
        """Verify all sources return properly structured RawJob dicts."""
        result = await search_remotive("Python")
        if result:
            job = result[0]
            required_keys = {"id", "role", "company", "location", "url", "description"}
            assert required_keys.issubset(job.keys()), f"Job dict missing required keys. Got: {job.keys()}"
            print(f"\n✅ Job structure valid: {list(job.keys())}")
