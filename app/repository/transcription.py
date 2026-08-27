from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.repository.base import Base


class Transcription(Base):
    """
    Auto-generated text transcription of a voice AreaObservation.
    One transcription per voice observation (1-to-1).
    """
    __tablename__ = "transcriptions"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    # ── Foreign Key ───────────────────────────────────────────────────────
    observation_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("area_observations.id", ondelete="CASCADE"),  # fixed table name
        nullable=False,
        unique=True,  # 1-to-1 with observation
    )

    # ── Transcription content ─────────────────────────────────────────────
    transcription_text: Mapped[str] = mapped_column(Text, nullable=False)

    # Optional: confidence score from the speech-to-text provider (0.0–1.0)
    confidence: Mapped[float | None] = mapped_column(nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # ── Relationships ─────────────────────────────────────────────────────

    # → The voice observation this transcription belongs to
    observation: Mapped["AreaObservation"] = relationship(
        back_populates="transcription",
    )
