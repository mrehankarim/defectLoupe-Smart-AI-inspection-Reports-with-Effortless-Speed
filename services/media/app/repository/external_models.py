"""Minimal core-table mirror used only to resolve media foreign keys."""
from uuid import UUID
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.repository.base import Base


class InspectionArea(Base):
    __tablename__ = "inspection_areas"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    photos = relationship("AreaPhoto", back_populates="inspection_area")
    observations = relationship("AreaObservation", back_populates="inspection_area")
