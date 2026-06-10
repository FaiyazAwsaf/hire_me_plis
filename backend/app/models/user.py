import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, Integer, Text, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

JOB_SEARCH_LIMIT = 5
CHAT_MESSAGE_LIMIT = 5


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("idx_users_email", "email"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    email: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    hashed_pw: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    job_searches_used: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    chat_messages_used: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))

    cv_versions: Mapped[list["CVVersion"]] = relationship(
        "CVVersion", back_populates="user", cascade="all, delete-orphan"
    )
    cv_profile: Mapped["CVProfile | None"] = relationship(
        "CVProfile", back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    applications: Mapped[list["Application"]] = relationship(
        "Application", back_populates="user", cascade="all, delete-orphan"
    )
    goals: Mapped[list["Goal"]] = relationship(
        "Goal", back_populates="user", cascade="all, delete-orphan"
    )
    calendar_events: Mapped[list["CalendarEvent"]] = relationship(
        "CalendarEvent", back_populates="user", cascade="all, delete-orphan"
    )
    nudges: Mapped[list["Nudge"]] = relationship(
        "Nudge", back_populates="user", cascade="all, delete-orphan"
    )
