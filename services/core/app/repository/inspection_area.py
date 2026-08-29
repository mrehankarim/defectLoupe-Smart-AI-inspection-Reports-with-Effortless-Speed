from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.repository.base import Base


class InspectionArea(Base):
   
    __tablename__ = "inspection_areas"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    inspection_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("inspections.id", ondelete="CASCADE"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(Text, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


    inspection: Mapped["Inspection"] = relationship(
        back_populates="inspection_areas",
    )

    photos: Mapped[list["AreaPhoto"]] = relationship(
        back_populates="inspection_area",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    observations: Mapped[list["AreaObservation"]] = relationship(
        back_populates="inspection_area",
        cascade="all, delete-orphan",
        lazy="selectin",
    )