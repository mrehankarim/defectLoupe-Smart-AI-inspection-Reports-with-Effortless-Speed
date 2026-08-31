from uuid import UUID, uuid4
from sqlalchemy import Boolean, DateTime, Enum as SAEnum, String, Text
from sqlalchemy import func
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.repository.base import Base
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from shared.auth_roles import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
    )

    hashed_password: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    refresh_token: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_admin: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role_enum"),
        nullable=False,
        default=UserRole.INSPECTOR,
        server_default=UserRole.INSPECTOR.value,
    )

    email_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    email_verification_token: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        unique=True,
        index=True,
    )

    email_verification_token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    inspector: Mapped["Inspector | None"] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )