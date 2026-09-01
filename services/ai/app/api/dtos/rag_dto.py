"""Pydantic v2 DTOs for the RAG Knowledge Base endpoints."""
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RagSearchRequest(BaseModel):
    """Request body for the vector similarity search endpoint."""
    query: str = Field(min_length=1, description="Natural-language search query")
    limit: int = Field(default=5, ge=1, le=50, description="Max results to return")


class SearchResultItem(BaseModel):
    """A single search result from the knowledge base."""
    id: UUID
    filename: str
    chunk_text: str
    score: float = Field(description="Similarity score (1 - cosine distance)")


class RagSearchResponse(BaseModel):
    """Response wrapper for the search endpoint."""
    results: list[SearchResultItem]


class DocumentResponse(BaseModel):
    """Summary of an ingested document."""
    id: UUID
    filename: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentUploadResponse(BaseModel):
    """Response after a successful document upload."""
    filename: str
    chunks_created: int
