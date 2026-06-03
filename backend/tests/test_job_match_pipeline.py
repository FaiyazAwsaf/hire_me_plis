"""
Day 4 — job fit scoring unit tests:
  scroll_section_texts, get_user_experience_years, search_chunks (section filter),
  extract_jd_skills, extract_years_required, score, fit_score_job

All external I/O (Qdrant, LLM embeddings, Postgres) is mocked — no live services required.
"""
from contextlib import ExitStack
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.ai.agents.fit_scorer.extractor import extract_jd_skills, extract_years_required
from app.ai.agents.fit_scorer.scorer import FitScoreResult, score
from app.ai.vector_store.scroll import get_user_experience_years, scroll_section_texts
from app.ai.vector_store.search import SearchResult, search_chunks
from app.services.job_service import fit_score_job

FAKE_VECTOR = [0.1] * 1536
FAKE_JD = "Looking for a Python engineer with 3+ years experience in FastAPI and Docker."


def _search_result(sc: float, idx: int = 0) -> SearchResult:
    """Minimal SearchResult factory — score is the only value that varies in semantic tests."""
    return SearchResult(text="worked at Acme", section="experience", score=sc, chunk_index=idx)


# ---------------------------------------------------------------------------
# scroll_section_texts
# ---------------------------------------------------------------------------

class TestScrollSectionTexts:
    async def test_user_and_section_filters_applied(self):
        """Both user_id and section must appear in the scroll filter's must-conditions.

        This is the isolation guarantee: scrolling 'skills' for user A must never
        return chunks owned by user B, and must only return skills-section chunks.
        """
        fake_point = MagicMock()
        fake_point.payload = {"text": "Python FastAPI Docker"}

        with patch(
            "app.ai.vector_store.scroll.qdrant.scroll",
            new_callable=AsyncMock,
            return_value=([fake_point], None),
        ) as mock_scroll:
            result = await scroll_section_texts("user-1", "skills")

        assert result == ["Python FastAPI Docker"]

        scroll_filter = mock_scroll.call_args.kwargs["scroll_filter"]
        keys = {c.key for c in scroll_filter.must}
        assert keys == {"user_id", "section"}

    async def test_returns_empty_when_no_chunks(self):
        with patch(
            "app.ai.vector_store.scroll.qdrant.scroll",
            new_callable=AsyncMock,
            return_value=([], None),
        ):
            result = await scroll_section_texts("user-1", "skills")

        assert result == []


# ---------------------------------------------------------------------------
# get_user_experience_years
# ---------------------------------------------------------------------------

class TestGetUserExperienceYears:
    async def test_returns_experience_years_from_payload(self):
        """experience_years is stamped on every chunk at ingestion — reads it back without a DB join."""
        fake_point = MagicMock()
        fake_point.payload = {"experience_years": 5}

        with patch(
            "app.ai.vector_store.scroll.qdrant.scroll",
            new_callable=AsyncMock,
            return_value=([fake_point], None),
        ):
            result = await get_user_experience_years("user-1")

        assert result == 5

    async def test_returns_zero_when_no_cv_ingested(self):
        """Scorer must handle a user who hasn't uploaded a CV yet without crashing."""
        with patch(
            "app.ai.vector_store.scroll.qdrant.scroll",
            new_callable=AsyncMock,
            return_value=([], None),
        ):
            result = await get_user_experience_years("user-1")

        assert result == 0


# ---------------------------------------------------------------------------
# search_chunks — section filter (non-breaking change)
# ---------------------------------------------------------------------------

class TestSearchChunksSectionFilter:
    async def test_section_param_adds_second_must_condition(self):
        """When section='experience' is passed, the Qdrant filter must contain both
        user_id and section conditions — not just user_id alone."""
        with patch(
            "app.ai.vector_store.search.qdrant.search",
            new_callable=AsyncMock,
            return_value=[],
        ) as mock_search:
            await search_chunks(FAKE_VECTOR, "user-1", section="experience")

        query_filter = mock_search.call_args.kwargs["query_filter"]
        assert len(query_filter.must) == 2
        keys = {c.key for c in query_filter.must}
        assert keys == {"user_id", "section"}

    async def test_no_section_keeps_single_user_id_condition(self):
        """Existing callers that omit section must be unaffected — backward compatibility."""
        with patch(
            "app.ai.vector_store.search.qdrant.search",
            new_callable=AsyncMock,
            return_value=[],
        ) as mock_search:
            await search_chunks(FAKE_VECTOR, "user-1")

        query_filter = mock_search.call_args.kwargs["query_filter"]
        assert len(query_filter.must) == 1
        assert query_filter.must[0].key == "user_id"


# ---------------------------------------------------------------------------
# extract_jd_skills
# ---------------------------------------------------------------------------

class TestExtractJdSkills:
    async def test_parses_clean_json_array(self):
        with patch(
            "app.ai.agents.fit_scorer.extractor.generate",
            new_callable=AsyncMock,
            return_value='["Python", "FastAPI", "Docker"]',
        ):
            result = await extract_jd_skills(FAKE_JD)

        assert result == ["Python", "FastAPI", "Docker"]

    async def test_strips_markdown_fences_before_parsing(self):
        """LLMs often wrap JSON in ```json``` fences despite being told not to."""
        with patch(
            "app.ai.agents.fit_scorer.extractor.generate",
            new_callable=AsyncMock,
            return_value='```json\n["Python", "Docker"]\n```',
        ):
            result = await extract_jd_skills(FAKE_JD)

        assert result == ["Python", "Docker"]

    async def test_returns_empty_list_on_invalid_json(self):
        """A garbled LLM response must degrade to an empty list, not crash the scorer."""
        with patch(
            "app.ai.agents.fit_scorer.extractor.generate",
            new_callable=AsyncMock,
            return_value="Sorry, I cannot help with that.",
        ):
            result = await extract_jd_skills(FAKE_JD)

        assert result == []


# ---------------------------------------------------------------------------
# extract_years_required
# ---------------------------------------------------------------------------

class TestExtractYearsRequired:
    async def test_parses_integer_years(self):
        with patch(
            "app.ai.agents.fit_scorer.extractor.generate",
            new_callable=AsyncMock,
            return_value='{"years_required": 3}',
        ):
            result = await extract_years_required(FAKE_JD)

        assert result == 3

    async def test_returns_none_when_explicitly_null(self):
        """years_required: null means no requirement — scorer uses 80/100 neutral default."""
        with patch(
            "app.ai.agents.fit_scorer.extractor.generate",
            new_callable=AsyncMock,
            return_value='{"years_required": null}',
        ):
            result = await extract_years_required(FAKE_JD)

        assert result is None

    async def test_returns_none_on_parse_error(self):
        """Graceful failure: any exception returns None, scorer applies the neutral default."""
        with patch(
            "app.ai.agents.fit_scorer.extractor.generate",
            new_callable=AsyncMock,
            return_value="not json at all",
        ):
            result = await extract_years_required(FAKE_JD)

        assert result is None


# ---------------------------------------------------------------------------
# score — formula correctness
# ---------------------------------------------------------------------------

class TestFitScore:
    """All tests patch the six I/O calls inside score() so only the math runs live."""

    def _build_mocks(self, stack: ExitStack, *, jd_skills, years_required, cv_skills_texts,
                     experience_results, cv_years) -> None:
        stack.enter_context(patch(
            "app.ai.agents.fit_scorer.scorer.extract_jd_skills",
            AsyncMock(return_value=jd_skills),
        ))
        stack.enter_context(patch(
            "app.ai.agents.fit_scorer.scorer.extract_years_required",
            AsyncMock(return_value=years_required),
        ))
        stack.enter_context(patch(
            "app.ai.agents.fit_scorer.scorer.embed_text",
            AsyncMock(return_value=FAKE_VECTOR),
        ))
        stack.enter_context(patch(
            "app.ai.agents.fit_scorer.scorer.scroll_section_texts",
            AsyncMock(return_value=cv_skills_texts),
        ))
        stack.enter_context(patch(
            "app.ai.agents.fit_scorer.scorer.search_chunks",
            AsyncMock(return_value=experience_results),
        ))
        stack.enter_context(patch(
            "app.ai.agents.fit_scorer.scorer.get_user_experience_years",
            AsyncMock(return_value=cv_years),
        ))
        stack.enter_context(patch(
            "app.ai.agents.fit_scorer.scorer.build_context",
            MagicMock(return_value="[experience]\nworked at Acme"),
        ))
        stack.enter_context(patch(
            "app.ai.agents.fit_scorer.scorer.generate",
            AsyncMock(return_value="You are a strong fit for this role."),
        ))

    async def test_skill_match_jaccard_formula(self):
        """Jaccard on word tokens: jd={'python','docker'}, cv={'python','fastapi','react'}
        intersection=1, union=4 → skill_match = round(1/4 * 100) = 25."""
        with ExitStack() as stack:
            self._build_mocks(
                stack,
                jd_skills=["Python", "Docker"],
                years_required=None,
                cv_skills_texts=["Python FastAPI React"],
                experience_results=[_search_result(0.8)],
                cv_years=3,
            )
            result = await score(FAKE_JD, "user-1")

        assert result.skill_match == 25

    async def test_skill_match_zero_when_no_overlap(self):
        with ExitStack() as stack:
            self._build_mocks(
                stack,
                jd_skills=["Rust", "WebAssembly"],
                years_required=None,
                cv_skills_texts=["Python FastAPI PostgreSQL"],
                experience_results=[_search_result(0.8)],
                cv_years=3,
            )
            result = await score(FAKE_JD, "user-1")

        assert result.skill_match == 0

    async def test_semantic_match_averages_top3_only(self):
        """When 5 experience chunks are returned, only the top-3 cosine scores are averaged.

        Scores: [0.9, 0.8, 0.7, 0.6, 0.5] — top-3 avg = (0.9+0.8+0.7)/3 ≈ 0.8 → 80.
        The 4th and 5th chunks must not influence the result.
        """
        results = [_search_result(sc, i) for i, sc in enumerate([0.9, 0.8, 0.7, 0.6, 0.5])]
        with ExitStack() as stack:
            self._build_mocks(
                stack,
                jd_skills=[],
                years_required=None,
                cv_skills_texts=[],
                experience_results=results,
                cv_years=3,
            )
            result = await score(FAKE_JD, "user-1")

        assert result.semantic_match == 80

    async def test_semantic_match_zero_when_no_experience_chunks(self):
        """A user whose CV has no experience section gets 0 semantic match, not a crash."""
        with ExitStack() as stack:
            self._build_mocks(
                stack,
                jd_skills=[],
                years_required=None,
                cv_skills_texts=[],
                experience_results=[],
                cv_years=0,
            )
            result = await score(FAKE_JD, "user-1")

        assert result.semantic_match == 0

    async def test_experience_match_defaults_to_80_when_jd_has_no_requirement(self):
        """None years_required means the JD doesn't state a requirement — neutral 80, not 0."""
        with ExitStack() as stack:
            self._build_mocks(
                stack,
                jd_skills=[],
                years_required=None,
                cv_skills_texts=[],
                experience_results=[],
                cv_years=3,
            )
            result = await score(FAKE_JD, "user-1")

        assert result.experience_match == 80

    async def test_experience_match_linear_scale(self):
        """cv_years=3 against years_required=5 → round(3/5 * 100) = 60."""
        with ExitStack() as stack:
            self._build_mocks(
                stack,
                jd_skills=[],
                years_required=5,
                cv_skills_texts=[],
                experience_results=[],
                cv_years=3,
            )
            result = await score(FAKE_JD, "user-1")

        assert result.experience_match == 60

    async def test_experience_match_capped_at_100(self):
        """Overqualified candidates (cv_years > years_required) must not exceed 100."""
        with ExitStack() as stack:
            self._build_mocks(
                stack,
                jd_skills=[],
                years_required=2,
                cv_skills_texts=[],
                experience_results=[],
                cv_years=8,
            )
            result = await score(FAKE_JD, "user-1")

        assert result.experience_match == 100

    async def test_weighted_total_formula(self):
        """Total = round(0.4 * skill + 0.4 * semantic + 0.2 * experience).

        Setup: skill=25, semantic=80, experience=60
        Expected: round(0.4*25 + 0.4*80 + 0.2*60) = round(10 + 32 + 12) = 54.
        """
        results = [_search_result(sc, i) for i, sc in enumerate([0.9, 0.8, 0.7])]
        with ExitStack() as stack:
            self._build_mocks(
                stack,
                jd_skills=["Python", "Docker"],         # → skill_match=25 (1 overlap out of 4)
                years_required=5,                        # → experience_match=60 (3/5)
                cv_skills_texts=["Python FastAPI React"],
                experience_results=results,              # → semantic_match=80 (avg of 0.9,0.8,0.7)
                cv_years=3,
            )
            result = await score(FAKE_JD, "user-1")

        assert result.skill_match == 25
        assert result.semantic_match == 80
        assert result.experience_match == 60
        assert result.score == 54

    async def test_explanation_is_populated(self):
        """Claude explanation must be the string returned by generate()."""
        with ExitStack() as stack:
            self._build_mocks(
                stack,
                jd_skills=["Python"],
                years_required=3,
                cv_skills_texts=["Python FastAPI"],
                experience_results=[_search_result(0.8)],
                cv_years=4,
            )
            result = await score(FAKE_JD, "user-1")

        assert result.explanation == "You are a strong fit for this role."


# ---------------------------------------------------------------------------
# fit_score_job — service layer
# ---------------------------------------------------------------------------

class TestFitScoreJob:
    def _mock_db(self, cv_row) -> AsyncMock:
        """Build a mock AsyncSession whose execute().scalar_one_or_none() returns cv_row.

        scalar_one_or_none() is synchronous in real SQLAlchemy, so the execute result
        must be a plain MagicMock — not AsyncMock — otherwise calling it returns an
        unawaited coroutine (truthy), which bypasses the 'cv is None' guard.
        """
        execute_result = MagicMock()
        execute_result.scalar_one_or_none.return_value = cv_row
        db = AsyncMock()
        db.execute = AsyncMock(return_value=execute_result)
        return db

    async def test_raises_404_when_no_processed_cv(self):
        """Scoring without a processed CV would return 0/0/0 against an empty Qdrant collection.
        The service must gate on CVStatus.done before calling the scorer.
        """
        mock_db = self._mock_db(cv_row=None)

        with pytest.raises(HTTPException) as exc_info:
            await fit_score_job("some jd text", "user-uuid-1234", mock_db)

        assert exc_info.value.status_code == 404

    async def test_returns_fit_score_response_on_success(self):
        """When a processed CV exists, the scorer result must be wrapped in FitScoreResponse."""
        mock_db = self._mock_db(cv_row=MagicMock())  # a CVVersion row

        fake_result = FitScoreResult(
            score=73,
            skill_match=60,
            semantic_match=80,
            experience_match=80,
            explanation="Solid Python background aligns well.",
        )

        with patch(
            "app.services.job_service.score",
            new_callable=AsyncMock,
            return_value=fake_result,
        ):
            response = await fit_score_job("some jd text", "user-uuid-1234", mock_db)

        assert response.score == 73
        assert response.breakdown.skill_match == 60
        assert response.breakdown.semantic_match == 80
        assert response.breakdown.experience_match == 80
        assert response.explanation == "Solid Python background aligns well."
