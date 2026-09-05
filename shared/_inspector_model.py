"""Lightweight Inspector model for shared auth dependencies.

Read-only mirror of the inspectors table so every service can look up
the logged-in user's inspector profile without importing auth-service code.
"""
import enum
from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import DateTime, String, Text, ForeignKey, Enum as SAEnum
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from shared.base import Base


class InspectorType(str, enum.Enum):
    INDIVIDUAL = "individual"
    AGENCY_MEMBER = "agency_member"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            for member in cls:
                if member.value.lower() == value.lower() or member.name.lower() == value.lower():
                    return member
        return None


class Inspector(Base):
    __tablename__ = "inspectors"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, unique=True,
    )
    company_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("companies.id", ondelete="SET NULL"),
        nullable=True,
    )
    first_name: Mapped[str] = mapped_column(Text, nullable=False)
    last_name: Mapped[str] = mapped_column(Text, nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    license_number: Mapped[str | None] = mapped_column(Text, nullable=True)
    inspector_type: Mapped[InspectorType] = mapped_column(
        SAEnum(
            InspectorType,
            name="inspector_type_enum",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False, default=InspectorType.INDIVIDUAL,
    )
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
    )
