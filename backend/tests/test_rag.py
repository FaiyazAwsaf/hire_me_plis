"""
RAG pipeline unit tests: build_context, redis_load_history, redis_append, retrieve.
All external I/O (Redis, Qdrant, OpenAI) is mocked — no live services required.
"""
import json
from unittest.mock import AsyncMock, MagicMock, patch

from app.ai.rag.context import build_context
from app.ai.rag.memory import redis_append, redis_load_history
from app.ai.rag.retriever import _classify_intent, retrieve
from app.ai.vector_store.search import SearchResult

_FAKE_VECTOR = [0.1] * 1536
_ISO = "2024-01-01T00:00:00+00:00"


def _result(section: str, text: str, idx: int = 0) -> SearchResult:
    return SearchResult(text=text, section=section, score=0.9, chunk_index=idx)


def _make_redis_mock(lrange_return=None):
    """Build a redis_pool mock covering pipeline (rpush/ltrim/expire/execute) and lrange.

    pipeline() is a synchronous call that returns mock_pipe, which acts as both
    a regular object and an async context manager. The queuing methods (rpush, ltrim,
    expire) are sync MagicMocks because they only buffer commands; execute() is async.
    """
    mock_pipe = MagicMock()
    mock_pipe.__aenter__ = AsyncMock(return_value=mock_pipe)
    mock_pipe.__aexit__ = AsyncMock(return_value=False)
    mock_pipe.rpush = MagicMock()
    mock_pipe.ltrim = MagicMock()
    mock_pipe.expire = MagicMock()
    mock_pipe.execute = AsyncMock(return_value=[1, b"OK", 1])

    mock_redis = MagicMock()
    mock_redis.pipeline = MagicMock(return_value=mock_pipe)
    mock_redis.lrange = AsyncMock(return_value=lrange_return or [])
    return mock_redis, mock_pipe


# ---------------------------------------------------------------------------
# build_context — pure sync function, no mocks needed
# ---------------------------------------------------------------------------

class TestContext:
    def test_empty_results_returns_empty_string(self):
        assert build_context([]) == ""

    def test_single_result_has_section_label(self):
        ctx = build_context([_result("experience", "Led backend team")])
        assert "[experience]" in ctx

    def test_text_content_preserved(self):
        ctx = build_context([_result("skills", "Python, FastAPI, Postgres")])
        assert "Python, FastAPI, Postgres" in ctx

    def test_multiple_sections_all_present(self):
        results = [
            _result("experience", "Acme engineer", idx=0),
            _result("skills", "Python", idx=1),
            _result("education", "BSc CS", idx=2),
        ]
        ctx = build_context(results)
        assert "[experience]" in ctx
        assert "[skills]" in ctx
        assert "[education]" in ctx

    def test_section_label_appears_before_text(self):
        ctx = build_context([_result("experience", "Led backend team")])
        assert ctx.index("[experience]") < ctx.index("Led backend team")

    def test_chunks_separated_by_double_newline(self):
        ctx = build_context([_result("experience", "A"), _result("skills", "B")])
        assert "\n\n" in ctx


# ---------------------------------------------------------------------------
# Redis memory — mock redis_pool
# ---------------------------------------------------------------------------

class TestMemory:
    async def test_redis_append_calls_pipeline_rpush_ltrim_expire_execute(self):
        mock_redis, mock_pipe = _make_redis_mock()
        with patch("app.ai.rag.memory.redis_pool", mock_redis):
            await redis_append("sess-1", "user", "hello", _ISO)

        mock_pipe.rpush.assert_called_once()
        mock_pipe.ltrim.assert_called_once()
        mock_pipe.expire.assert_called_once()
        mock_pipe.execute.assert_awaited_once()

    async def test_redis_append_correct_key_format(self):
        """Key must follow session:{id}:messages — the pattern all readers expect."""
        mock_redis, mock_pipe = _make_redis_mock()
        with patch("app.ai.rag.memory.redis_pool", mock_redis):
            await redis_append("sess-abc", "user", "hi", _ISO)

        key_used = mock_pipe.rpush.call_args.args[0]
        assert key_used == "session:sess-abc:messages"

    async def test_redis_append_preserves_created_at_iso(self):
        """created_at_iso from the caller must survive verbatim into the JSON payload.

        Critical for the Postgres re-seed path: if memory.py generated its own
        datetime.now(), replayed messages would have wrong timestamps.
        """
        mock_redis, mock_pipe = _make_redis_mock()
        custom_iso = "2024-06-15T10:30:00+00:00"
        with patch("app.ai.rag.memory.redis_pool", mock_redis):
            await redis_append("sess-1", "user", "hello", custom_iso)

        msg_json = mock_pipe.rpush.call_args.args[1]
        parsed = json.loads(msg_json)
        assert parsed["created_at"] == custom_iso

    async def test_redis_append_ltrim_keeps_last_20(self):
        mock_redis, mock_pipe = _make_redis_mock()
        with patch("app.ai.rag.memory.redis_pool", mock_redis):
            await redis_append("sess-1", "user", "hello", _ISO)

        start = mock_pipe.ltrim.call_args.args[1]
        stop = mock_pipe.ltrim.call_args.args[2]
        assert start == -20  # 20th from end
        assert stop == -1    # last element

    async def test_redis_append_expire_is_2_hours(self):
        mock_redis, mock_pipe = _make_redis_mock()
        with patch("app.ai.rag.memory.redis_pool", mock_redis):
            await redis_append("sess-1", "user", "hello", _ISO)

        assert mock_pipe.expire.call_args.args[1] == 7200

    async def test_ttl_reset_on_every_append(self):
        """expire must fire once per redis_append — each message resets the 2-hour window."""
        mock_redis, mock_pipe = _make_redis_mock()
        with patch("app.ai.rag.memory.redis_pool", mock_redis):
            await redis_append("sess-1", "user", "msg1", _ISO)
            await redis_append("sess-1", "assistant", "msg2", _ISO)

        assert mock_pipe.expire.call_count == 2

    async def test_redis_load_returns_empty_on_cache_miss(self):
        mock_redis, _ = _make_redis_mock(lrange_return=[])
        with patch("app.ai.rag.memory.redis_pool", mock_redis):
            result = await redis_load_history("sess-missing")
        assert result == []

    async def test_redis_load_parses_json_strings(self):
        """lrange returns raw JSON strings; redis_load_history must deserialize them."""
        raw = [
            json.dumps({"role": "user", "content": "hi", "created_at": _ISO}),
            json.dumps({"role": "assistant", "content": "hello", "created_at": _ISO}),
        ]
        mock_redis, _ = _make_redis_mock(lrange_return=raw)
        with patch("app.ai.rag.memory.redis_pool", mock_redis):
            result = await redis_load_history("sess-1")

        assert len(result) == 2
        assert result[0] == {"role": "user", "content": "hi", "created_at": _ISO}
        assert result[1] == {"role": "assistant", "content": "hello", "created_at": _ISO}


# ---------------------------------------------------------------------------
# _classify_intent — mock generate to test JSON parsing and fallback
# ---------------------------------------------------------------------------

_SEMANTIC_CLASSIFY = AsyncMock(return_value=("semantic_search", None))
_ENUMERATE_EXPERIENCE = AsyncMock(return_value=("enumerate_section", "experience"))


class TestClassifyIntent:
    async def test_enumerate_section_returns_correct_tuple(self):
        raw = '{"intent": "enumerate_section", "section": "projects"}'
        with patch("app.ai.rag.retriever.generate", AsyncMock(return_value=raw)):
            intent, section = await _classify_intent("list all my projects")
        assert intent == "enumerate_section"
        assert section == "projects"

    async def test_semantic_search_returns_none_section(self):
        raw = '{"intent": "semantic_search"}'
        with patch("app.ai.rag.retriever.generate", AsyncMock(return_value=raw)):
            intent, section = await _classify_intent("am I ready for a data engineer role?")
        assert intent == "semantic_search"
        assert section is None

    async def test_invalid_section_name_falls_back_to_semantic(self):
        """LLM returning an unknown section name must not be trusted — fall back to vector search."""
        raw = '{"intent": "enumerate_section", "section": "hobbies"}'
        with patch("app.ai.rag.retriever.generate", AsyncMock(return_value=raw)):
            intent, section = await _classify_intent("list all my hobbies")
        assert intent == "semantic_search"
        assert section is None

    async def test_llm_failure_falls_back_to_semantic(self):
        """If the LLM call raises, _classify_intent must degrade gracefully, never re-raise."""
        with patch("app.ai.rag.retriever.generate", AsyncMock(side_effect=Exception("LLM down"))):
            intent, section = await _classify_intent("list all my projects")
        assert intent == "semantic_search"
        assert section is None

    async def test_malformed_json_falls_back_to_semantic(self):
        """Unparseable LLM output must not propagate a JSONDecodeError."""
        with patch("app.ai.rag.retriever.generate", AsyncMock(return_value="not json at all")):
            intent, section = await _classify_intent("show me my skills")
        assert intent == "semantic_search"
        assert section is None


# ---------------------------------------------------------------------------
# retrieve — mock _classify_intent to test routing logic in isolation
# ---------------------------------------------------------------------------

class TestRetriever:
    async def test_semantic_query_passes_query_to_embed(self):
        with patch("app.ai.rag.retriever._classify_intent", AsyncMock(return_value=("semantic_search", None))), \
             patch("app.ai.rag.retriever.embed_text", AsyncMock(return_value=_FAKE_VECTOR)) as mock_embed, \
             patch("app.ai.rag.retriever.search_chunks", AsyncMock(return_value=[])):
            await retrieve("what are my strongest skills?", "user-1")
        mock_embed.assert_awaited_once_with("what are my strongest skills?")

    async def test_semantic_query_passes_vector_to_search(self):
        """The vector from embed_text must flow into search_chunks unchanged."""
        custom_vec = [0.5] * 1536
        with patch("app.ai.rag.retriever._classify_intent", AsyncMock(return_value=("semantic_search", None))), \
             patch("app.ai.rag.retriever.embed_text", AsyncMock(return_value=custom_vec)), \
             patch("app.ai.rag.retriever.search_chunks", AsyncMock(return_value=[])) as mock_search:
            await retrieve("query", "user-1")
        assert mock_search.call_args.args[0] == custom_vec

    async def test_semantic_query_passes_user_id_and_top_k(self):
        with patch("app.ai.rag.retriever._classify_intent", AsyncMock(return_value=("semantic_search", None))), \
             patch("app.ai.rag.retriever.embed_text", AsyncMock(return_value=_FAKE_VECTOR)), \
             patch("app.ai.rag.retriever.search_chunks", AsyncMock(return_value=[])) as mock_search:
            await retrieve("query", "user-xyz", top_k=3)
        mock_search.assert_awaited_once_with(_FAKE_VECTOR, "user-xyz", 3)

    async def test_enumerate_query_uses_scroll_not_vector_search(self):
        """Section enumeration must use scroll (full recall) and never call embed_text."""
        with patch("app.ai.rag.retriever._classify_intent", AsyncMock(return_value=("enumerate_section", "projects"))), \
             patch("app.ai.rag.retriever.scroll_section_texts", AsyncMock(return_value=["proj A", "proj B"])) as mock_scroll, \
             patch("app.ai.rag.retriever.embed_text", AsyncMock()) as mock_embed:
            results = await retrieve("list all my projects", "user-1")
        mock_scroll.assert_awaited_once_with("user-1", "projects")
        mock_embed.assert_not_awaited()
        assert len(results) == 2
        assert all(r.section == "projects" for r in results)
        assert all(r.score == 1.0 for r in results)

    async def test_enumerate_wraps_texts_as_search_results_with_sequential_index(self):
        """scroll texts must map to SearchResult with score=1.0 and sequential chunk_index."""
        with patch("app.ai.rag.retriever._classify_intent", AsyncMock(return_value=("enumerate_section", "experience"))), \
             patch("app.ai.rag.retriever.scroll_section_texts", AsyncMock(return_value=["A", "B", "C"])):
            results = await retrieve("show me my experience", "user-1")
        assert [(r.text, r.chunk_index) for r in results] == [("A", 0), ("B", 1), ("C", 2)]

    async def test_returns_empty_list_on_no_results(self):
        """Empty Qdrant results must never raise — propagated as [] to callers."""
        with patch("app.ai.rag.retriever._classify_intent", AsyncMock(return_value=("semantic_search", None))), \
             patch("app.ai.rag.retriever.embed_text", AsyncMock(return_value=_FAKE_VECTOR)), \
             patch("app.ai.rag.retriever.search_chunks", AsyncMock(return_value=[])):
            result = await retrieve("obscure query", "user-1")
        assert result == []
