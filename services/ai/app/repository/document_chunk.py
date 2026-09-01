"""DocumentChunk ORM model for RAG vector search.

Stores text chunks extracted from uploaded inspection documents
alongside their embedding vectors (all-MiniLM-L6-v2, 384 dimensions).
"""
from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, JSON
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from pgvector.sqlalchemy import Vector

from app.repository.base import Base


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    company_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    filename: Mapped[str] = mapped_column(String(255), nullable=False)

    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)

    embedding = mapped_column(Vector(384), nullable=False)

    chunk_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    uploaded_by: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("inspectors.id", ondelete="CASCADE"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
