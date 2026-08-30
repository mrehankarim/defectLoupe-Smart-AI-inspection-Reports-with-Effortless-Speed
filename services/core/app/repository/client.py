from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.repository.base import Base


class Client(Base):
    """
    A client (property owner / home buyer) managed by an inspector or agency.
    """
    __tablename__ = "clients"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    first_name: Mapped[str] = mapped_column(Text, nullable=False)
    last_name: Mapped[str] = mapped_column(Text, nullable=False)

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
    )
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # ── Foreign Keys ──────────────────────────────────────────────────────

    # The inspector directly responsible for this client (optional if billed
    # via an agency directly)
    inspector_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("inspectors.id", ondelete="SET NULL"),
        nullable=True,
    )

    # The agency the client is associated with (optional for solo inspectors)
    company_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # ── Relationships ─────────────────────────────────────────────────────

    # → Inspector who manages this client (cross-service — no back_populates)
    inspector: Mapped["Inspector | None"] = relationship()

    # → Agency this client is associated with (cross-service — no back_populates)
    company: Mapped["Company | None"] = relationship()

    # → Properties owned by this client
    properties: Mapped[list["Property"]] = relationship(
        back_populates="client",
        cascade="all, delete-orphan",
        lazy="selectin",
    )