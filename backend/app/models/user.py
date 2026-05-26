import uuid
from datetime import datetime

from sqlalchemy import DateTime, Index, Text, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


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
