import enum
from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import DateTime, String, Text, ForeignKey, Enum as SAEnum
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.repository.base import Base


class InspectorType(str, enum.Enum):
    INDIVIDUAL = "individual"
    AGENCY_MEMBER = "agency_member"


class Inspector(Base):
    __tablename__ = "inspectors"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False,
        unique=True,   
    )

    company_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="SET NULL"),
        nullable=True,
    )

    first_name: Mapped[str] = mapped_column(Text, nullable=False)
    last_name: Mapped[str] = mapped_column(Text, nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    license_number: Mapped[str | None] = mapped_column(Text, nullable=True)

    inspector_type: Mapped[InspectorType] = mapped_column(
        SAEnum(InspectorType, name="inspector_type_enum"),
        nullable=False,
        default=InspectorType.INDIVIDUAL,
    )

    is_active: Mapped[bool] = mapped_column(default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    user: Mapped["User"] = relationship(
        back_populates="inspector",
    )

    company: Mapped["Company | None"] = relationship(
        back_populates="inspectors",
        foreign_keys="[Inspector.company_id]",
    )
