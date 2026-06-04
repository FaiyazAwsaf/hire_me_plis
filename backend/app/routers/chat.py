import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.exceptions import HTTPException

from app.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.chat import ChatHistoryResponse
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
