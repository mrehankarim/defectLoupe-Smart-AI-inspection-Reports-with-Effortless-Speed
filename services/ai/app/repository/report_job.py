"""ReportJob ORM model for async PDF report generation.

Tracks the lifecycle of a report generation request from queued
through processing to either ready (with PDF URL) or failed.
"""
import enum
from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import DateTime, String, Text, JSON, Enum as SAEnum
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.repository.base import Base


class ReportStatus(str, enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class ReportJob(Base):
    __tablename__ = "report_jobs"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    inspection_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    status: Mapped[ReportStatus] = mapped_column(
        SAEnum(
            ReportStatus,
            name="report_status_enum",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        default=ReportStatus.QUEUED,
    )

    pdf_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    report_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    verify_token: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False,
    )

    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
