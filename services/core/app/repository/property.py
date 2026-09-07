import enum
from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Enum as SAEnum
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.repository.base import Base
from shared.case_insensitive_enum import CaseInsensitiveEnum


class PropertyType(str, enum.Enum):
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    INDUSTRIAL = "industrial"
    OTHER = "other"


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

   
    client_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
    )

    address: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    zip_code: Mapped[str] = mapped_column(String(20), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False, default="US")

    property_type: Mapped[PropertyType] = mapped_column(
        CaseInsensitiveEnum(PropertyType, name="property_type_enum"),
        nullable=False,
        default=PropertyType.RESIDENTIAL,
    )
    year_built: Mapped[int | None] = mapped_column(Integer, nullable=True)
    square_footage: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


    client: Mapped["Client"] = relationship(
        back_populates="properties",
    )

    inspections: Mapped[list["Inspection"]] = relationship(
        back_populates="property",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    