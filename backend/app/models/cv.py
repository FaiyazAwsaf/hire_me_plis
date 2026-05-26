import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Index, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CVStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    embedding = "embedding"
    done = "done"
    error = "error"


class CVVersion(Base):
    __tablename__ = "cv_versions"
    __table_args__ = (
        Index("idx_cv_versions_user_id", "user_id"),
        Index("idx_cv_versions_user_status", "user_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    filename: Mapped[str] = mapped_column(Text, nullable=False)
    r2_key: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[CVStatus] = mapped_column(
        SAEnum(CVStatus, name="cv_status"),
        nullable=False,
        server_default=text("'pending'"),
    )
    error_msg: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="cv_versions")


class CVProfile(Base):
    __tablename__ = "cv_profiles"
    __table_args__ = (
        Index("idx_cv_profiles_user_id", "user_id", unique=True),
        Index("idx_cv_profiles_updated_at", "updated_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    profile: Mapped[dict] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="cv_profile")
