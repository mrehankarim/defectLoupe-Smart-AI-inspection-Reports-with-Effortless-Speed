"""Report-preview API backed by the core inspection context."""
import os
from uuid import UUID
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from shared.auth_deps import get_current_inspector

router = APIRouter(prefix="/api/v1/inspections", tags=["reports"])
CORE_SERVICE_URL = os.getenv("CORE_SERVICE_URL", "http://core:8000")

async def _context(inspection_id: UUID, request: Request) -> dict:
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(f"{CORE_SERVICE_URL}/api/v1/inspections/{inspection_id}/full-context", headers={"cookie": request.headers.get("cookie", "")})
    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Inspection not found")
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Core inspection service is unavailable")
    return response.json()

@router.post("/{inspection_id}/generate-report")
async def generate_report(inspection_id: UUID, request: Request, _=Depends(get_current_inspector)):
    context = await _context(inspection_id, request)
    inspection, areas = context["inspection"], context.get("areas", [])
    return {"inspection_id": str(inspection_id), "title": inspection.get("title") or "Property inspection report", "status": "generated", "summary": f"Inspection includes {len(areas)} documented area(s).", "areas": areas, "report_url": f"/api/v1/inspections/{inspection_id}/report"}

@router.get("/{inspection_id}/report")
async def get_report(inspection_id: UUID, request: Request, _=Depends(get_current_inspector)):
    """Retrieve a previously generated report (idempotent GET)."""
    context = await _context(inspection_id, request)
    inspection, areas = context.get("inspection", {}), context.get("areas", [])
    return {
        "inspection_id": str(inspection_id),
        "title": inspection.get("title") or "Property inspection report",
        "status": inspection.get("status", "unknown"),
        "summary": f"Inspection includes {len(areas)} documented area(s).",
        "areas": areas,
        "report_url": f"/api/v1/inspections/{inspection_id}/report",
    }
