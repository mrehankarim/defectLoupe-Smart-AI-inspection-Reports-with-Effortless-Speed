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


class RagSynthesis(BaseModel):
    """Structured LLM engineering synthesis generated from RAG context."""
    answer: str = Field(description="Direct synthesized answer to the query")
    code_references: list[str] = Field(default_factory=list, description="Specific standards or code sections cited")
    violation_thresholds: str | None = Field(default=None, description="Measurable thresholds triggering defects or violations")
    remediation_protocol: str | None = Field(default=None, description="Recommended remediation or repair protocol")
    severity: str | None = Field(default=None, description="Defect severity: Low, Medium, High, or Critical")


class RagSearchResponse(BaseModel):
    """Response wrapper for the search endpoint with LLM synthesis and retrieved sources."""
    query: str | None = None
    synthesis: RagSynthesis | None = None
    results: list[SearchResultItem]


class DocumentResponse(BaseModel):
    """Summary of an ingested document."""
    id: UUID
    filename: str
    created_at: datetime
    chunk_count: int | None = None

    model_config = ConfigDict(from_attributes=True)


class DocumentUploadResponse(BaseModel):
    """Response after a successful document upload."""
    filename: str
    chunks_created: int
