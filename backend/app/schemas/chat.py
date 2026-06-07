from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class ChatMessage(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    role: Literal["user", "assistant"]
    content: str
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    session_id: str
    messages: list[ChatMessage]


class SessionSummary(BaseModel):
    session_id: str
    label: str          # first user message, truncated to 60 chars
    started_at: datetime


class SessionListResponse(BaseModel):
    sessions: list[SessionSummary]
