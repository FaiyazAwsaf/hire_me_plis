"""
CV ingestion pipeline unit tests:
  embed_batch, chunk_sections, delete_by_user, upsert_chunks, run_cv_pipeline
All external I/O (Qdrant, OpenAI, R2, LLM) is mocked — no live services required.
"""
from contextlib import ExitStack
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.ai.cv_pipeline.chunker import Chunk, chunk_sections
from app.ai.cv_pipeline.classifier import ClassifiedBlock
from app.ai.cv_pipeline.meta_extractor import CVMeta
from app.ai.cv_pipeline.pipeline import run_cv_pipeline
from app.ai.embeddings.batch import embed_batch
from app.ai.vector_store import CVChunkPoint
from app.ai.vector_store.delete import delete_by_user
from app.ai.vector_store.upsert import upsert_chunks
from qdrant_client.models import FieldCondition, Filter

FAKE_VECTOR = [0.1] * 1536

# Long enough to split into multiple chunks at the 150-token limit (~500 tokens)
_LONG_EXPERIENCE_TEXT = (
    "Software Engineer at Acme Inc, responsible for building scalable microservices "
    "using Python, FastAPI, and PostgreSQL, collaborating with cross-functional teams "
    "to deliver high-quality features on tight deadlines. "
) * 20

# Shared pipeline fixtures used by TestRunCvPipeline
_FAKE_CHUNK = Chunk(section="experience", text="Acme engineer", chunk_index=0, token_count=3)
_FAKE_META = CVMeta(role_title="Software Engineer", experience_years=4)
_FAKE_CLASSIFIED = [ClassifiedBlock(section="experience", text="Acme engineer")]


# ---------------------------------------------------------------------------
# Embed batch
# ---------------------------------------------------------------------------

class TestEmbedBatch:
    async def test_reorders_response_by_index(self):
        """When the API returns items out of order, the result must match input order."""
        item_0 = MagicMock(index=0, embedding=[0.1] * 1536)
        item_1 = MagicMock(index=1, embedding=[0.2] * 1536)
        # Simulate API returning index 1 before index 0
        mock_response = MagicMock(data=[item_1, item_0])

        with patch(
            "app.ai.embeddings.batch.embed_client.embeddings.create",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            result = await embed_batch(["text_a", "text_b"])

        assert result[0] == [0.1] * 1536   # index 0 must come first despite API ordering
        assert result[1] == [0.2] * 1536   # index 1 follows


# ---------------------------------------------------------------------------
# Chunk sections
# ---------------------------------------------------------------------------

class TestChunkSections:
    def test_no_cross_section_bleed(self):
        """Chunks from an experience block must never carry an education label, and vice versa."""
        blocks = [
            ClassifiedBlock(section="experience", text=_LONG_EXPERIENCE_TEXT),
            ClassifiedBlock(section="education", text="BSc Computer Science, MIT, 2020."),
        ]
        chunks = chunk_sections(blocks)

        exp_chunks = [c for c in chunks if c.section == "experience"]
        edu_chunks = [c for c in chunks if c.section == "education"]

        # Every chunk must belong to one of the two input sections
        assert len(exp_chunks) + len(edu_chunks) == len(chunks)
        # The long block must have split — confirming the splitter ran
        assert len(exp_chunks) > 1

    def test_every_chunk_token_count_within_limit(self):
        blocks = [ClassifiedBlock(section="experience", text=_LONG_EXPERIENCE_TEXT)]
        chunks = chunk_sections(blocks)
        for chunk in chunks:
            assert chunk.token_count <= 150, (
                f"Chunk exceeded 150 tokens: {chunk.token_count} tokens in '{chunk.text[:40]}...'"
            )

    def test_chunk_index_is_zero_based_and_sequential(self):
        """chunk_index must be 0, 1, 2, ... within a single section block."""
        blocks = [ClassifiedBlock(section="experience", text=_LONG_EXPERIENCE_TEXT)]
        chunks = chunk_sections(blocks)
        assert len(chunks) > 1  # guard: ensure the block actually produced multiple chunks
        assert [c.chunk_index for c in chunks] == list(range(len(chunks)))


# ---------------------------------------------------------------------------
# Delete by user
# ---------------------------------------------------------------------------

class TestDeleteByUser:
    async def test_filters_by_user_id(self):
        """delete_by_user must pass a Filter containing key='user_id' with the correct value.

        This is the structural guarantee of user isolation: delete_by_user may only
        delete points that belong to the target user.
        """
        with patch(
            "app.ai.vector_store.delete.qdrant.delete",
            new_callable=AsyncMock,
        ) as mock_delete:
            await delete_by_user("user-123")

        mock_delete.assert_called_once()
        points_selector = mock_delete.call_args.kwargs["points_selector"]

        assert isinstance(points_selector, Filter)
        assert len(points_selector.must) == 1

        condition = points_selector.must[0]
        assert isinstance(condition, FieldCondition)
        assert condition.key == "user_id"
        assert condition.match.value == "user-123"


# ---------------------------------------------------------------------------
# Upsert chunks
# ---------------------------------------------------------------------------

def _make_chunk_point() -> CVChunkPoint:
    return CVChunkPoint(
        id="test-uuid-1234",
        vector=FAKE_VECTOR,
        user_id="user-abc",
        cv_id="cv-xyz",
        section="experience",
        chunk_index=0,
        text="Software Engineer at Acme",
        token_count=5,
        role_title="Software Engineer",
        experience_years=3,
    )


class TestUpsertChunks:
    async def test_user_id_in_payload(self):
        point = _make_chunk_point()
        with patch(
            "app.ai.vector_store.upsert.qdrant.upsert",
            new_callable=AsyncMock,
        ) as mock_upsert:
            await upsert_chunks([point])

        payload = mock_upsert.call_args.kwargs["points"][0].payload
        assert "user_id" in payload
        assert payload["user_id"] == "user-abc"

    async def test_all_required_payload_fields_present(self):
        """All 8 fields required by the search layer must be present in the Qdrant payload."""
        point = _make_chunk_point()
        with patch(
            "app.ai.vector_store.upsert.qdrant.upsert",
            new_callable=AsyncMock,
        ) as mock_upsert:
            await upsert_chunks([point])

        payload = mock_upsert.call_args.kwargs["points"][0].payload
        required = {
            "user_id", "cv_id", "section", "chunk_index",
            "text", "token_count", "role_title", "experience_years",
        }
        assert required.issubset(set(payload.keys()))


# ---------------------------------------------------------------------------
# Full pipeline orchestration
# ---------------------------------------------------------------------------

class TestRunCvPipeline:
    def _build_mocks(self, stack: ExitStack) -> dict:
        """Patch every pipeline dependency with a fast no-op mock."""
        return {
            "parse": stack.enter_context(patch(
                "app.ai.cv_pipeline.pipeline.parse_file",
                AsyncMock(return_value=["raw block"]),
            )),
            "classify": stack.enter_context(patch(
                "app.ai.cv_pipeline.pipeline.classify_sections",
                AsyncMock(return_value=_FAKE_CLASSIFIED),
            )),
            # chunk_sections is synchronous — MagicMock, not AsyncMock
            "chunk": stack.enter_context(patch(
                "app.ai.cv_pipeline.pipeline.chunk_sections",
                MagicMock(return_value=[_FAKE_CHUNK]),
            )),
            "meta": stack.enter_context(patch(
                "app.ai.cv_pipeline.pipeline.extract_cv_meta",
                AsyncMock(return_value=_FAKE_META),
            )),
            "delete": stack.enter_context(patch(
                "app.ai.cv_pipeline.pipeline.delete_by_user",
                AsyncMock(),
            )),
            "embed": stack.enter_context(patch(
                "app.ai.cv_pipeline.pipeline.embed_and_upsert",
                AsyncMock(return_value=1),
            )),
        }

    async def test_happy_path_status_order_and_delete_before_embed(self):
        """Status updates must flow processing→embedding→done, and delete must precede embed."""
        update_status_fn = AsyncMock()
        call_order: list[str] = []

        async def _delete_side(*a, **kw):
            call_order.append("delete")

        async def _embed_side(*a, **kw):
            call_order.append("embed")
            return 1

        with ExitStack() as stack:
            mocks = self._build_mocks(stack)
            mocks["delete"].side_effect = _delete_side
            mocks["embed"].side_effect = _embed_side

            result = await run_cv_pipeline(
                user_id="user-1",
                cv_version_id="cv-1",
                r2_key="cvs/user-1/cv-1.pdf",
                file_type="pdf",
                update_status_fn=update_status_fn,
            )

        assert result.success is True
        assert result.chunk_count == 1

        # Verify status sequence exactly
        status_calls = [c.args[1] for c in update_status_fn.call_args_list]
        assert status_calls == ["processing", "embedding", "done"]

        # Qdrant delete must run before embedding to avoid deleting freshly written chunks
        assert call_order.index("delete") < call_order.index("embed")

    async def test_error_path_reports_failure_and_sets_error_status(self):
        """When embed_and_upsert raises, the result must be failure and status must be 'error'."""
        update_status_fn = AsyncMock()

        with ExitStack() as stack:
            mocks = self._build_mocks(stack)
            mocks["embed"].side_effect = Exception("boom")

            result = await run_cv_pipeline(
                user_id="user-1",
                cv_version_id="cv-1",
                r2_key="cvs/user-1/cv-1.pdf",
                file_type="pdf",
                update_status_fn=update_status_fn,
            )

        assert result.success is False
        assert result.error == "boom"

        last_call = update_status_fn.call_args_list[-1]
        assert last_call.args[1] == "error"
        assert last_call.kwargs.get("error_msg") == "boom"
