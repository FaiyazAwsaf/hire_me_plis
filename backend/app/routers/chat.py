import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy import select, func, distinct, delete
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.exceptions import HTTPException

from app.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.chat import ChatHistoryResponse, SessionListResponse, SessionSummary
from app.schemas.chat import ChatMessage as ChatMessageSchema
from app.services import chat_service
from app.services.auth_service import decode_access_token

router = APIRouter(prefix="/chat", tags=["chat"])

_DB = Annotated[AsyncSession, Depends(get_db)]
_User = Annotated[User, Depends(get_current_user)]


@router.websocket("/ws")
async def chat_ws(websocket: WebSocket, db: _DB):
    """Stream chat responses over WebSocket.

    Auth via ?token=<jwt> query param — browsers cannot set Authorization headers
    on WebSocket connections, so the JWT travels in the URL instead.
    """
    # Accept before any close/send — the upgrade handshake must complete first
    await websocket.accept()

    # --- Auth ---
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    try:
        payload = decode_access_token(token)
        user_id = uuid.UUID(payload["sub"])
    except (HTTPException, ValueError):
        await websocket.close(code=4001)
        return

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        await websocket.close(code=4001)
        return

    # --- Message loop ---
    while True:
        try:
            data = await websocket.receive_json()
            message = data["message"]
            session_id = data["session_id"]
        except WebSocketDisconnect:
            break
        except (KeyError, ValueError):
            await websocket.send_json({"type": "error", "content": "Invalid message format"})
            continue

        try:
            async for token in chat_service.handle_chat(str(user.id), session_id, message, db):
                await websocket.send_json({"type": "token", "content": token})
            await websocket.send_json({"type": "done", "content": ""})
        except Exception as e:
            await websocket.send_json({"type": "error", "content": str(e)})


@router.get("/sessions", response_model=SessionListResponse)
async def list_sessions(current_user: _User, db: _DB):
    """Return all distinct chat sessions for the user, newest first.

    Each session carries the first user message as a human-readable label.
    """
    from app.models.chat_message import ChatMessage as ChatMessageModel

    # Subquery: earliest created_at per session (determines sort order)
    # and first user-role message content (used as label)
    subq = (
        select(
            ChatMessageModel.session_id,
            func.min(ChatMessageModel.created_at).label("started_at"),
        )
        .where(ChatMessageModel.user_id == current_user.id)
        .group_by(ChatMessageModel.session_id)
        .subquery()
    )

    result = await db.execute(
        select(subq).order_by(subq.c.started_at.desc())
    )
    rows = result.all()

    sessions: list[SessionSummary] = []
    for row in rows:
        # Fetch the first user message for this session to use as label
        first_msg_result = await db.execute(
            select(ChatMessageModel.content)
            .where(
                ChatMessageModel.user_id == current_user.id,
                ChatMessageModel.session_id == row.session_id,
                ChatMessageModel.role == "user",
            )
            .order_by(ChatMessageModel.created_at.asc())
            .limit(1)
        )
        first_msg = first_msg_result.scalar_one_or_none()
        label = (first_msg[:60] + "…") if first_msg and len(first_msg) > 60 else (first_msg or row.session_id[:8].upper())
        sessions.append(SessionSummary(session_id=row.session_id, label=label, started_at=row.started_at))

    return SessionListResponse(sessions=sessions)


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(session_id: str, current_user: _User, db: _DB):
    """Delete all messages in a session. Only deletes messages owned by the current user."""
    from app.models.chat_message import ChatMessage as ChatMessageModel

    await db.execute(
        delete(ChatMessageModel).where(
            ChatMessageModel.user_id == current_user.id,
            ChatMessageModel.session_id == session_id,
        )
    )
    await db.commit()


@router.get("/history", response_model=ChatHistoryResponse)
async def chat_history(
    session_id: str,
    current_user: _User,
    db: _DB,
    limit: int = 20,
):
    """Return persisted message history for a session.

    Called by the frontend before the user types — renders previous messages in the UI.
    Returns an empty messages list (not 404) when the session doesn't exist yet.
    """
    history = await chat_service.load_history(session_id, str(current_user.id), db, limit)
    messages = [
        ChatMessageSchema(
            role=m["role"],
            content=m["content"],
            created_at=datetime.fromisoformat(m["created_at"]),
        )
        for m in history
    ]
    return ChatHistoryResponse(session_id=session_id, messages=messages)
