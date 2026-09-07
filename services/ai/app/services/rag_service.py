"""RAG service — document ingestion and vector knowledge-base search.

Handles parsing uploaded documents (PDF, TXT, MD), chunking, embedding,
storing chunks in PostgreSQL with pgvector, and performing cosine-distance
similarity search scoped by tenant (company_id).
"""
import io
import json
import logging
import os
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import delete, func as sa_func, cast, Text
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
    limit: int = 4,
    min_score: float = 0.20,
) -> list[dict]:
    """Cosine-distance search over document chunks with relevance filtering.

    Returns a list of dicts with keys: id, filename, chunk_text, score.
    Lower cosine distance → higher similarity; score = 1 - distance.
    Filters out noise/unrelated documents whose similarity score is below min_score
    or significantly lower than the top candidate.
    """
    # Guard: If no documents are in the knowledge base, avoid model load/embedding overhead
    has_chunks = db.query(DocumentChunk.id).first() is not None
    if not has_chunks:
        return []

    query_embedding = generate_embeddings([query])[0]

    # Compute cosine distance
    distance_col = DocumentChunk.embedding.cosine_distance(query_embedding)

    # Fetch top candidate chunks (up to limit * 2 to filter noise)
    fetch_limit = max(limit * 2, 8)
    stmt = (
        DocumentChunk.__table__.select()
        .add_columns((1 - distance_col).label("score"))
        .order_by(distance_col)
        .limit(fetch_limit)
    )

    if company_id is not None:
        stmt = stmt.where(
            (DocumentChunk.company_id == company_id) | (DocumentChunk.company_id.is_(None))
        )

    results = db.execute(stmt).all()
    if not results:
        return []

    # Filter by minimum score and relative drop-off from top candidate
    raw_candidates = [
        {
            "id": row.id,
            "filename": row.filename,
            "chunk_text": row.chunk_text,
            "score": float(row.score),
        }
        for row in results
    ]

    top_score = raw_candidates[0]["score"] if raw_candidates else 0.0
    filtered = []
    for c in raw_candidates:
        # Must meet the absolute minimum relevance threshold
        if c["score"] < min_score:
            continue
        # If the top candidate is genuinely relevant (>= 0.25), drop chunks that
        # have less than 55% of the top candidate's similarity to prune unrelated topics
        if top_score >= 0.25 and c["score"] < (top_score * 0.55):
            continue
        filtered.append(c)
        if len(filtered) >= limit:
            break

    # If nothing passed the relative filter but top candidates met min_score, keep top 1-2
    if not filtered and raw_candidates and raw_candidates[0]["score"] >= min_score:
        filtered = raw_candidates[:min(2, limit)]

    return filtered


def synthesize_rag_response(
    query: str,
    retrieved_chunks: list[dict],
) -> dict:
    """Synthesize a structured engineering advisory using Gemini 2.5 Flash over RAG context or general building codes."""
    if retrieved_chunks:
        context_blocks = []
        for idx, chunk in enumerate(retrieved_chunks, 1):
            context_blocks.append(
                f"--- SOURCE EXCERPT {idx} [Document: {chunk.get('filename')}] ---\n{chunk.get('chunk_text')}"
            )
        context_str = "\n\n".join(context_blocks)
        prompt = (
            "You are DefectLoupe's Building Code & Forensic Engineering Assistant. "
            "Synthesize a concise, direct, professional engineering advisory based on the building code excerpts below.\n\n"
            f"INSPECTOR QUERY: {query}\n\n"
            f"RETRIEVED KNOWLEDGE BASE EXCERPTS:\n{context_str}\n\n"
            "Return ONLY a JSON object with these keys:\n"
            "- answer: (string) Concise, high-density technical summary (maximum 2-3 sentences, strictly under 100 words).\n"
            "- code_references: (list of strings) Clean, compact code citations (e.g. ['IRC 2024 R905', 'IBC Sec 1904']). Max 3 items.\n"
            "- violation_thresholds: (string) 1 concise sentence stating exact numerical limit/failure criteria.\n"
            "- remediation_protocol: (string) 1 concise sentence stating the technical fix.\n"
            "- severity: (string) One of: 'Low', 'Medium', 'High', 'Critical'.\n"
        )
    else:
        prompt = (
            "You are DefectLoupe's Building Code & Forensic Engineering Advisory Assistant. "
            "An inspector has asked you a question. If it is a technical building code, structural, defect, or property question, "
            "provide an authoritative engineering advisory based on standard international and US building codes (IBC, IRC, NEC, ASTM, ACI). "
            "If the query is conversational (e.g., 'hello', 'yoo you litening'), respond pleasantly and professionally, letting them know you are ready to assist with building code analysis.\n\n"
            f"INSPECTOR QUERY: {query}\n\n"
            "Return ONLY a JSON object with these keys:\n"
            "- answer: (string) Technical advisory summary or friendly assistant response.\n"
            "- code_references: (list of strings) Applicable building codes or [] if conversational.\n"
            "- violation_thresholds: (string or null) Numerical tolerance or limit if applicable, else null.\n"
            "- remediation_protocol: (string or null) Recommended engineering repair step if applicable, else null.\n"
            "- severity: (string) 'Low', 'Medium', 'High', or 'Critical'. Default 'Low' for conversational.\n"
        )

    # 1. Primary: Gemini 2.5 Flash
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=500,
                    response_mime_type="application/json",
                ),
            )
            parsed = json.loads(response.text)
            return {
                "answer": parsed.get("answer", "").strip(),
                "code_references": parsed.get("code_references", []),
                "violation_thresholds": parsed.get("violation_thresholds"),
                "remediation_protocol": parsed.get("remediation_protocol"),
                "severity": parsed.get("severity", "Medium"),
            }
        except Exception as exc:
            logger.warning("Gemini RAG synthesis failed (%s); trying Groq fallback", exc)

    # 2. Secondary: Groq LLM if configured
    groq_api_key = os.getenv("GROQ_API_KEY", "")
    if groq_api_key:
        try:
            import httpx
            groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
            resp = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": groq_model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2,
                    "max_tokens": 400,
                    "response_format": {"type": "json_object"},
                },
                timeout=20.0,
            )
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"].strip()
            parsed = json.loads(raw_text)
            return {
                "answer": parsed.get("answer", "").strip(),
                "code_references": parsed.get("code_references", []),
                "violation_thresholds": parsed.get("violation_thresholds"),
                "remediation_protocol": parsed.get("remediation_protocol"),
                "severity": parsed.get("severity", "Medium"),
            }
        except Exception as exc:
            logger.warning("Groq RAG synthesis fallback failed: %s", exc)

    # 3. Default fallback
    if retrieved_chunks:
        top_chunk = retrieved_chunks[0]
        filenames = list({c.get("filename") for c in retrieved_chunks})
        return {
            "answer": f"Based on retrieved engineering standards ({', '.join(filenames)}): {top_chunk.get('chunk_text')[:350]}...",
            "code_references": [f.replace(".md", "").replace(".txt", "").replace("_", " ") for f in filenames],
            "violation_thresholds": "Refer to specific sections in the cited engineering manuals for numeric tolerances.",
            "remediation_protocol": "Perform certified contractor inspection and execute remediation per manufacturer and jurisdiction specifications.",
            "severity": "Medium",
        }

    return {
        "answer": "Yes! I am active and ready to assist. Ask any question regarding building codes (IBC, IRC, NEC, ASTM), foundation settlement tolerances, electrical panel clearances, or roof slopes, or upload project manuals to index custom standards.",
        "code_references": ["IBC 2024", "IRC 2024"],
        "violation_thresholds": None,
        "remediation_protocol": None,
        "severity": "Low",
    }


def list_documents(
    company_id: UUID | None,
    db: Session,
) -> list[dict]:
    """Return a deduplicated list of ingested documents for the tenant."""
    stmt = (
        db.query(
            DocumentChunk.filename,
            sa_func.min(cast(DocumentChunk.id, Text)).label("id"),
            sa_func.min(DocumentChunk.created_at).label("created_at"),
            sa_func.count(DocumentChunk.id).label("chunk_count"),
        )
        .group_by(DocumentChunk.filename)
        .order_by(sa_func.min(DocumentChunk.created_at).desc())
    )
    if company_id is not None:
        stmt = stmt.filter(
            (DocumentChunk.company_id == company_id) | (DocumentChunk.company_id.is_(None))
        )

    return [
        {
            "id": row.id,
            "filename": row.filename,
            "created_at": row.created_at,
            "chunk_count": int(row.chunk_count),
        }
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
