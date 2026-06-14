import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum as SAEnum, ForeignKey, Index, Text, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ApplicationStatus(str, enum.Enum):
    shortlist = "shortlist"
    applied = "applied"
    interviewing = "interviewing"
    offer = "offer"
    rejected = "rejected"


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        Index("idx_applications_user_id", "user_id"),
        Index("idx_applications_user_status", "user_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(Text, nullable=False)
    company: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ApplicationStatus] = mapped_column(
        SAEnum(ApplicationStatus, name="application_status"),
        nullable=False,
        server_default=text("'applied'"),
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    salary_range: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_letter_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Stores a summary of the job description for AI context (populated at save-from-job-hunt)
    jd_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    applied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="applications")


# DESC ordering cannot be expressed inline in __table_args__, so defined post-class
Index("idx_applications_applied_at", Application.user_id, Application.applied_at.desc())
