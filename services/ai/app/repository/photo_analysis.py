"""PhotoAnalysis ORM model for AI defect detection results.

Stores the output of Gemini vision analysis on inspection photos,
including defect labels, severity, description, and remediation advice.
"""
from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import DateTime, String, Text, JSON
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.repository.base import Base


class PhotoAnalysis(Base):
    __tablename__ = "photo_analyses"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    photo_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    defect_labels: Mapped[dict] = mapped_column(JSON, nullable=False)

    severity: Mapped[str] = mapped_column(String(50), nullable=False)

    description: Mapped[str] = mapped_column(Text, nullable=False)

    remediation: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
