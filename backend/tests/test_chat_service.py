"""
Chat service unit tests: save_message, load_history.
DB (SQLAlchemy AsyncSession) and Redis are fully mocked — no live services required.
"""
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.chat_service import load_history, save_message

# Valid UUID string — uuid.UUID() is called inside save_message and load_history
_USER_ID = "00000000-0000-0000-0000-000000000001"
_SESSION_ID = "test-session-abc"
_ISO = "2024-01-01T00:00:00+00:00"


def _make_db():
    """Minimal AsyncSession mock. db.add is sync; db.commit and db.execute are async."""
    db = AsyncMock()
    db.add = MagicMock()
    return db


def _make_pg_row(role: str, content: str) -> MagicMock:
    """Fake ORM ChatMessage row as returned by scalars().all()."""
    m = MagicMock()
    m.role = role
    m.content = content
    m.created_at = datetime(2024, 1, 1, tzinfo=timezone.utc)
    return m


def _db_with_rows(rows: list) -> AsyncMock:
    """DB mock pre-configured to return `rows` from execute().scalars().all()."""
    db = _make_db()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = rows
    db.execute = AsyncMock(return_value=mock_result)
    return db


# ---------------------------------------------------------------------------
# save_message
# ---------------------------------------------------------------------------

class TestSaveMessage:
    async def test_dual_write_postgres_then_redis(self):
        """Postgres commit must complete before the Redis write.

        If Redis fails after a Postgres commit, the message is still durable.
        If the order were reversed, a Redis success followed by a Postgres failure
        would put history in cache that can never be reconstructed from Postgres.
        """
        call_order = []
        db = _make_db()
        db.commit = AsyncMock(side_effect=lambda: call_order.append("postgres_commit"))

        async def _track_redis(*args, **kwargs):
            call_order.append("redis_append")

        with patch("app.services.chat_service.redis_append", side_effect=_track_redis):
            await save_message(_SESSION_ID, _USER_ID, "user", "hello", db)

        assert call_order == ["postgres_commit", "redis_append"]

    async def test_returns_created_at_iso_string(self):
        db = _make_db()
        with patch("app.services.chat_service.redis_append", AsyncMock()):
            result = await save_message(_SESSION_ID, _USER_ID, "user", "hello", db)

        # Must be a parseable, timezone-aware ISO datetime string
        parsed = datetime.fromisoformat(result)
        assert parsed.tzinfo is not None

    async def test_postgres_and_redis_share_same_timestamp(self):
        """ChatMessage.created_at and the ISO passed to redis_append must be identical.

        Both are derived from a single datetime.now() call — never two separate calls
        that could produce different values under timing pressure.
        """
        db = _make_db()
        captured_row = None
        captured_redis_iso = None

        def _capture_add(row):
            nonlocal captured_row
            captured_row = row

        async def _capture_redis(session_id, role, content, created_at_iso):
            nonlocal captured_redis_iso
            captured_redis_iso = created_at_iso

        db.add = MagicMock(side_effect=_capture_add)
        with patch("app.services.chat_service.redis_append", side_effect=_capture_redis):
            returned_iso = await save_message(_SESSION_ID, _USER_ID, "user", "hello", db)

        assert captured_row.created_at.isoformat() == captured_redis_iso == returned_iso


# ---------------------------------------------------------------------------
# load_history
# ---------------------------------------------------------------------------

class TestLoadHistory:
    async def test_redis_fast_path_no_db_query(self):
        """When Redis has messages, db.execute must never be called."""
        cached = [{"role": "user", "content": "hi", "created_at": _ISO}]
        db = _make_db()

        with patch("app.services.chat_service.redis_load_history", AsyncMock(return_value=cached)):
            result = await load_history(_SESSION_ID, _USER_ID, db)

        db.execute.assert_not_called()
        assert result == cached

    async def test_postgres_fallback_on_cache_miss(self):
        """When Redis returns [], db.execute must be called to load from Postgres."""
        db = _db_with_rows([])

        with patch("app.services.chat_service.redis_load_history", AsyncMock(return_value=[])), \
             patch("app.services.chat_service.redis_append", AsyncMock()):
            await load_history(_SESSION_ID, _USER_ID, db)

        db.execute.assert_awaited_once()

    async def test_postgres_fallback_reseeds_redis(self):
        """After a cache miss, redis_append must be called once per Postgres row."""
        rows = [_make_pg_row("user", "msg1"), _make_pg_row("assistant", "msg2")]
        db = _db_with_rows(rows)

        mock_redis_append = AsyncMock()
        with patch("app.services.chat_service.redis_load_history", AsyncMock(return_value=[])), \
             patch("app.services.chat_service.redis_append", mock_redis_append):
            await load_history(_SESSION_ID, _USER_ID, db)

        # One redis_append call per row — re-seeds the cache for the rest of the session
        assert mock_redis_append.await_count == len(rows)

    async def test_returns_empty_when_both_empty(self):
        """Redis empty + Postgres empty must return [] without raising."""
        db = _db_with_rows([])

        with patch("app.services.chat_service.redis_load_history", AsyncMock(return_value=[])), \
             patch("app.services.chat_service.redis_append", AsyncMock()):
            result = await load_history(_SESSION_ID, _USER_ID, db)

        assert result == []

    async def test_redis_fast_path_respects_limit(self):
        """When Redis has more messages than limit, return only the most recent `limit` messages."""
        cached = [
            {"role": "user", "content": f"msg{i}", "created_at": _ISO}
            for i in range(25)
        ]
        db = _make_db()

        with patch("app.services.chat_service.redis_load_history", AsyncMock(return_value=cached)):
            result = await load_history(_SESSION_ID, _USER_ID, db, limit=10)

        assert len(result) == 10
        assert result == cached[-10:]  # most recent 10
