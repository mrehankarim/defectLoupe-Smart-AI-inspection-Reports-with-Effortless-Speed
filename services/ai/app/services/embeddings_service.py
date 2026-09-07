"""Embedding service for RAG knowledge base.

Provides a lazy-loaded singleton SentenceTransformer model and helpers
for text chunking and embedding generation using all-MiniLM-L6-v2 (384-d).
"""
import threading
from typing import ClassVar


class _EmbeddingModel:
    """Lazy-loading singleton wrapper around SentenceTransformer."""

    _instance: ClassVar = None  # SentenceTransformer | None
    _lock: ClassVar[threading.Lock] = threading.Lock()
    _MODEL_NAME = "all-MiniLM-L6-v2"

    @classmethod
    def get_model(cls):
        """Return the shared model, loading it on first access.

        The import is deferred to here so that merely importing this
        module does not pull in torch / sklearn / etc.
        """
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    from sentence_transformers import SentenceTransformer
                    try:
                        cls._instance = SentenceTransformer(cls._MODEL_NAME, local_files_only=True)
                    except Exception:
                        cls._instance = SentenceTransformer(cls._MODEL_NAME)
        return cls._instance


def chunk_text(
    text: str,
    chunk_size: int = 500,
    overlap: int = 50,
) -> list[str]:
    """Split *text* into overlapping segments of roughly *chunk_size* characters.

    The splitter walks character-by-character with a stride of
    ``chunk_size - overlap`` so that context is preserved across boundaries.
    Empty / whitespace-only segments are dropped.
    """
    if not text or not text.strip():
        return []

    text = text.strip()
    if len(text) <= chunk_size:
        return [text]

    chunks: list[str] = []
    stride = max(chunk_size - overlap, 1)
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += stride
    return chunks


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Encode *texts* and return 384-dimensional float vectors.

    Prioritizes Gemini text-embedding-004 (output_dimensionality=384) to eliminate
    local PyTorch RAM consumption on 512MB free-tier containers. Falls back to
    SentenceTransformer if GEMINI_API_KEY is not available.
    """
    if not texts:
        return []

    import os
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=texts,
                output_dimensionality=384,
            )
            raw = result.get("embedding", [])
            if raw and isinstance(raw[0], (int, float)):
                return [raw]
            return raw
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("Gemini text-embedding-004 failed (%s); using local fallback", exc)

    model = _EmbeddingModel.get_model()
    embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
    return [emb.tolist() for emb in embeddings]
