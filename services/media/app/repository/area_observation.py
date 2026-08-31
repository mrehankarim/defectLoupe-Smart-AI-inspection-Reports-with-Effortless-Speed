import enum
from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.repository.base import Base


class ObservationType(str, enum.Enum):
    TEXT = "text"
    VOICE = "voice"


class AreaObservation(Base):
    __tablename__ = "area_observations"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    inspection_area_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("inspection_areas.id", ondelete="CASCADE"),
        nullable=False,
    )

    photo_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("area_photos.id", ondelete="SET NULL"),
        nullable=True,
    )

    observation_type: Mapped[ObservationType] = mapped_column(
        SAEnum(
            ObservationType,
            name="observation_type_enum",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
    )
    observation_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    audio_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Cross-service relationship to InspectionArea is omitted
    # (InspectionArea lives in core-service). Use the FK directly.

    photo: Mapped["AreaPhoto | None"] = relationship(
        back_populates="observations",
    )

    transcription: Mapped["Transcription | None"] = relationship(
        back_populates="observation",
        cascade="all, delete-orphan",
        uselist=False,
    )
