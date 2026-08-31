from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.repository.base import Base


class AreaPhoto(Base):
    
    __tablename__ = "area_photos"

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

    photo_url: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # Cross-service relationship to InspectionArea is omitted
    # (InspectionArea lives in core-service). Use the FK directly.

    observations: Mapped[list["AreaObservation"]] = relationship(
        back_populates="photo",
        lazy="selectin",
    )
