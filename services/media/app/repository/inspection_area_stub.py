"""Minimal stub for inspection_areas table.

This is a read-only reference so SQLAlchemy can resolve the FK from
area_photos / area_observations during commit.  The actual table is
owned by core-service.
"""
from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import DateTime, Text, ForeignKey
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from shared.base import Base


class InspectionArea(Base):
    __tablename__ = "inspection_areas"
    # Extend_existing prevents conflicts if another service also defines this
    __table_args__ = {"extend_existing": True}

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4,
    )
