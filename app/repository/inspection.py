import enum
from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.repository.base import Base


class InspectionStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Inspection(Base):
    
    __tablename__ = "inspections"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    inspector_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("inspectors.id", ondelete="CASCADE"),
        nullable=False,
    )
    property_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
    )

    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    status: Mapped[InspectionStatus] = mapped_column(
        SAEnum(InspectionStatus, name="inspection_status_enum"),
        nullable=False,
        default=InspectionStatus.IN_PROGRESS,
    )
    report_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


    inspector: Mapped["Inspector"] = relationship(
        back_populates="inspections",
    )

    # → Property being inspected
    property: Mapped["Property"] = relationship(
        back_populates="inspections",
    )

    inspection_areas: Mapped[list["InspectionArea"]] = relationship(
        back_populates="inspection",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="InspectionArea.display_order",
    )