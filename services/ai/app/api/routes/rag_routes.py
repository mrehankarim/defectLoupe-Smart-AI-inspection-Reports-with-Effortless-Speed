"""RAG Knowledge Base routes.

Exposes endpoints under /api/v1/rag for document ingestion,
vector similarity search, listing, and deletion.
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from shared.db_config import get_db
from shared.auth_deps import get_current_inspector
from app.api.dtos.rag_dto import (
    DocumentResponse,
    DocumentUploadResponse,
    RagSearchRequest,
    RagSearchResponse,
    RagSynthesis,
    SearchResultItem,
)
from app.services import rag_service

router = APIRouter(prefix="/api/v1/rag", tags=["RAG Knowledge Base"])


@router.post(
    "/documents/upload",
    response_model=DocumentUploadResponse,
    status_code=201,
    summary="Upload and ingest a document into the knowledge base",
)
async def upload_document(
    file: UploadFile = File(...),
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Accept a PDF, TXT, or MD file, chunk it, embed, and store."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")

    file_bytes = await file.read()
    chunks_created = rag_service.ingest_document(
        file_bytes=file_bytes,
        filename=file.filename,
        company_id=inspector.company_id,
        uploaded_by=inspector.id,
        db=db,
    )
    return DocumentUploadResponse(
        filename=file.filename,
        chunks_created=chunks_created,
    )


@router.post(
    "/search",
    response_model=RagSearchResponse,
    summary="Search the knowledge base using vector similarity and LLM synthesis",
)
def search_documents(
    body: RagSearchRequest,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Perform cosine-distance search + Gemini LLM synthesis over retrieved standards."""
    results = rag_service.search_knowledge_base(
        query=body.query,
        company_id=inspector.company_id,
        db=db,
        limit=body.limit,
    )
    synthesis_dict = rag_service.synthesize_rag_response(
        query=body.query,
        retrieved_chunks=results,
    )
    return RagSearchResponse(
        query=body.query,
        synthesis=RagSynthesis(**synthesis_dict) if synthesis_dict else None,
        results=[SearchResultItem(**r) for r in results],
    )


@router.get(
    "/documents",
    response_model=list[DocumentResponse],
    summary="List ingested documents (tenant-scoped)",
)
def list_documents(
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Return a deduplicated list of documents for the current tenant."""
    docs = rag_service.list_documents(
        company_id=inspector.company_id,
        db=db,
    )
    return [DocumentResponse(**d) for d in docs]


@router.delete(
    "/documents/{filename}",
    summary="Delete all chunks for a specific document",
)
def delete_document(
    filename: str,
    inspector=Depends(get_current_inspector),
    db: Session = Depends(get_db),
):
    """Remove all document chunks associated with the given filename."""
    deleted = rag_service.delete_document_chunks(
        filename=filename,
        company_id=inspector.company_id,
        db=db,
    )
    return {"filename": filename, "chunks_deleted": deleted}
