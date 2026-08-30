"""Custom area template model — allows users to save and reuse their own area lists."""
from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, JSON
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.repository.base import Base


class AreaTemplate(Base):
    """A user-created area template with a list of area names."""
    __tablename__ = "area_templates"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4,
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # JSON array of area names, e.g. ["Roof", "Kitchen", "Bathroom"]
    area_names: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    # Who created this template
    inspector_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("inspectors.id", ondelete="SET NULL"),
        nullable=True,
    )
    company_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="SET NULL"),
        nullable=True,
    )

    is_global: Mapped[bool] = mapped_column(default=False)  # visible to all

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
    )
