"""RAG service — document ingestion and vector knowledge-base search.

Handles parsing uploaded documents (PDF, TXT, MD), chunking, embedding,
storing chunks in PostgreSQL with pgvector, and performing cosine-distance
similarity search scoped by tenant (company_id).
"""
import io
import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import delete, func as sa_func
from sqlalchemy.orm import Session

from app.repository.document_chunk import DocumentChunk
from app.services.embeddings_service import chunk_text, generate_embeddings

logger = logging.getLogger(__name__)


# ── Document parsing ────────────────────────────────────────────────────────


def _parse_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF using pypdf."""
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(file_bytes))
    pages: list[str] = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n".join(pages)


def _parse_text(file_bytes: bytes) -> str:
    """Return UTF-8 decoded text (for .txt and .md files)."""
    return file_bytes.decode("utf-8", errors="replace")


def _extract_text(file_bytes: bytes, filename: str) -> str:
    """Dispatch to the correct parser based on file extension."""
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return _parse_pdf(file_bytes)
    elif lower.endswith(".txt") or lower.endswith(".md"):
        return _parse_text(file_bytes)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: '{filename}'. Accepted: .pdf, .txt, .md",
        )


# ── Public API ──────────────────────────────────────────────────────────────


def ingest_document(
    file_bytes: bytes,
    filename: str,
    company_id: UUID | None,
    uploaded_by: UUID,
    db: Session,
) -> int:
    """Parse *filename*, chunk its text, embed, and persist to the DB.

    Returns the number of chunks stored.
    """
    raw_text = _extract_text(file_bytes, filename)
    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Extracted text is empty.")

    chunks = chunk_text(raw_text)
    if not chunks:
        raise HTTPException(status_code=400, detail="No chunks produced from document.")

    embeddings = generate_embeddings(chunks)

    rows = [
        DocumentChunk(
            company_id=company_id,
            filename=filename,
            chunk_text=chunk,
            embedding=embedding,
            uploaded_by=uploaded_by,
        )
        for chunk, embedding in zip(chunks, embeddings)
    ]
    db.add_all(rows)
    db.commit()

    logger.info("Ingested %d chunks from '%s' (company=%s)", len(rows), filename, company_id)
    return len(rows)


def search_knowledge_base(
    query: str,
    company_id: UUID | None,
    db: Session,
    limit: int = 5,
) -> list[dict]:
    """Cosine-distance search over document chunks, optionally tenant-scoped.

    Returns a list of dicts with keys: id, filename, chunk_text, score.
    Lower cosine distance → higher similarity; score = 1 - distance.
    """
    query_embedding = generate_embeddings([query])[0]

    # Compute cosine distance; pgvector's <=> operator returns distance in [0, 2]
    # for non-normalized vectors.  With normalised embeddings the range is [0, 1].
    distance_col = DocumentChunk.embedding.cosine_distance(query_embedding)

    stmt = (
        DocumentChunk.__table__.select()
        .add_columns((1 - distance_col).label("score"))
        .order_by(distance_col)
        .limit(limit)
    )

    if company_id is not None:
        stmt = stmt.where(DocumentChunk.company_id == company_id)

    results = db.execute(stmt).all()

    return [
        {
            "id": row.id,
            "filename": row.filename,
            "chunk_text": row.chunk_text,
            "score": float(row.score),
        }
        for row in results
    ]


def list_documents(
    company_id: UUID | None,
    db: Session,
) -> list[dict]:
    """Return a deduplicated list of ingested documents for the tenant."""
    stmt = (
        db.query(
            DocumentChunk.filename,
            sa_func.min(DocumentChunk.id).label("id"),
            sa_func.min(DocumentChunk.created_at).label("created_at"),
        )
        .group_by(DocumentChunk.filename)
        .order_by(sa_func.min(DocumentChunk.created_at).desc())
    )
    if company_id is not None:
        stmt = stmt.filter(DocumentChunk.company_id == company_id)

    return [
        {"id": row.id, "filename": row.filename, "created_at": row.created_at}
        for row in stmt.all()
    ]


def delete_document_chunks(
    filename: str,
    company_id: UUID | None,
    db: Session,
) -> int:
    """Delete all chunks belonging to *filename* (optionally scoped by tenant).

    Returns the number of rows deleted.
    """
    stmt = delete(DocumentChunk).where(DocumentChunk.filename == filename)
    if company_id is not None:
        stmt = stmt.where(DocumentChunk.company_id == company_id)

    result = db.execute(stmt)
    db.commit()
    deleted = result.rowcount
    if deleted == 0:
        raise HTTPException(
            status_code=404,
            detail=f"No chunks found for filename '{filename}'.",
        )
    logger.info("Deleted %d chunks for '%s'", deleted, filename)
    return deleted
