from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.repository.base import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    name: Mapped[str] = mapped_column(Text, nullable=False)
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    website: Mapped[str | None] = mapped_column(Text, nullable=True)

    address: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    zip_code: Mapped[str] = mapped_column(String(20), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    
    inspectors: Mapped[list["Inspector"]] = relationship(
        back_populates="company",
        lazy="selectin",
    )

    clients: Mapped[list["Client"]] = relationship(
        back_populates="company",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
