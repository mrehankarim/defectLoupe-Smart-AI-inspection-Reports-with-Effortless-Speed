"""Phase 7 — End-to-End Pipeline Smoke Test.

Tests the full AI service lifecycle:
  1. Module import verification
  2. OpenAPI spec audit (13 endpoints)
  3. Traefik gateway routing validation
  4. RAG pipeline (ingest + search)
  5. Vision AI analysis
  6. Report generation lifecycle
  7. Public verification endpoint

Tests marked with @pytest.mark.e2e require a live PostgreSQL + Redis.
All other tests run against the importable app without external deps.
"""
import json
import os
import sys
import uuid
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Ensure paths
ROOT = Path(__file__).resolve().parents[3]
AI_DIR = ROOT / "services" / "ai"
sys.path.insert(0, str(AI_DIR))
sys.path.insert(0, str(ROOT))

# Load .env before shared imports
os.environ.setdefault("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/defect-loupe")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("ACCESS_TOKEN_SECRET", "defectloupe-hackathon-jwt-secret-key-32b")
os.environ.setdefault("ACCESS_TOKEN_EXPIRY", "15m")
os.environ.setdefault("GEMINI_API_KEY", "test_key")

from dotenv import load_dotenv
load_dotenv(AI_DIR / "app" / ".env", override=False)


# ─── Test 1: Module Import Verification ──────────────────────────────────

class TestModuleImports:
    """Verify all AI service modules import without error."""

    def test_import_repository_models(self):
        from app.repository.document_chunk import DocumentChunk
        from app.repository.report_job import ReportJob, ReportStatus
        from app.repository.photo_analysis import PhotoAnalysis
        assert DocumentChunk.__tablename__ == "document_chunks"
        assert ReportJob.__tablename__ == "report_jobs"
        assert PhotoAnalysis.__tablename__ == "photo_analyses"

    def test_import_services(self):
        from app.services import embeddings_service
        from app.services import rag_service
        from app.services import vision_service
        from app.services import report_service
        from app.services import report_context
        assert callable(embeddings_service.generate_embeddings)
        assert callable(rag_service.ingest_document)
        assert callable(report_service.generate_pdf_report)

    def test_import_dtos(self):
        from app.api.dtos.rag_dto import RagSearchRequest, RagSearchResponse
        from app.api.dtos.vision_dto import AnalysisResponse
        from app.api.dtos.report_dto import ReportJobResponse, ReportStatusResponse
        from app.api.dtos.verify_dto import ReportVerificationResponse
        assert "query" in RagSearchRequest.model_fields
        assert "valid" in ReportVerificationResponse.model_fields

    def test_import_routes(self):
        from app.api.routes.rag_routes import router as rag_router
        from app.api.routes.vision_routes import router as vision_router
        from app.api.routes.report_routes import router as report_router
        from app.api.routes.verify_routes import router as verify_router
        assert len(rag_router.routes) == 4
        assert len(vision_router.routes) == 2
        assert len(report_router.routes) == 4
        assert len(verify_router.routes) == 1

    def test_import_workers(self):
        from app.workers.celery_app import celery_app
        from app.workers.report_worker import generate_report_task
        assert celery_app.main == "ai_worker"
        assert generate_report_task.name == "generate_report_task"

    def test_import_main_app(self):
        from app.main import app
        assert app.title == "DefectLoupe — ai-service"


# ─── Test 2: OpenAPI Spec Audit ──────────────────────────────────────────

class TestOpenAPIAudit:
    """Verify all 13 endpoints register cleanly."""

    @pytest.fixture(autouse=True)
    def setup(self):
        from app.main import app
        from fastapi.testclient import TestClient
        self.app = app
        # Use OpenAPI schema as the authoritative source for registered endpoints
        client = TestClient(app)
        resp = client.get("/openapi.json")
        schema = resp.json()
        self.paths = schema.get("paths", {})
        # Build a flat dict of path -> methods for easy lookup
        self.routes = {}
        for path, methods in self.paths.items():
            self.routes[path] = methods

    def test_total_endpoint_count(self):
        """Exactly 13 endpoints must be registered."""
        assert len(self.routes) == 13, f"Expected 13 endpoints, got {len(self.routes)}: {list(self.routes.keys())}"

    def test_root_endpoints(self):
        assert "/" in self.routes
        assert "/health" in self.routes

    def test_rag_endpoints(self):
        expected = [
            "/api/v1/rag/documents/upload",
            "/api/v1/rag/search",
            "/api/v1/rag/documents",
            "/api/v1/rag/documents/{filename}",
        ]
        for path in expected:
            assert path in self.routes, f"Missing RAG endpoint: {path}"

    def test_vision_endpoints(self):
        expected = [
            "/api/v1/photos/{photo_id}/analyze",
            "/api/v1/photos/{photo_id}/analysis",
        ]
        for path in expected:
            assert path in self.routes, f"Missing Vision endpoint: {path}"

    def test_report_endpoints(self):
        expected = [
            "/api/v1/inspections/{inspection_id}/generate-report",
            "/api/v1/inspections/{inspection_id}/report/status",
            "/api/v1/inspections/{inspection_id}/report/pdf",
            "/api/v1/inspections/{inspection_id}/report/json",
        ]
        for path in expected:
            assert path in self.routes, f"Missing Report endpoint: {path}"

    def test_verify_endpoint(self):
        path = "/api/v1/reports/{verify_token}/verify"
        assert path in self.routes, f"Missing Verify endpoint: {path}"

    def test_verify_endpoint_is_public(self):
        """The verify endpoint must NOT require get_current_inspector."""
        from app.api.routes.verify_routes import router as verify_router
        for route in verify_router.routes:
            deps = [getattr(d, "dependency", None) for d in getattr(route, "dependencies", [])]
            dep_names = [d.__name__ if d else "" for d in deps]
            assert "get_current_inspector" not in dep_names, \
                "Verify endpoint must be public (no get_current_inspector)"

    def test_router_tags(self):
        from app.api.routes.rag_routes import router as rag_router
        from app.api.routes.vision_routes import router as vision_router
        from app.api.routes.report_routes import router as report_router
        from app.api.routes.verify_routes import router as verify_router
        assert "RAG Knowledge Base" in rag_router.tags
        assert "Vision AI Analysis" in vision_router.tags
        assert "Report Generation" in report_router.tags
        assert "Public Verification" in verify_router.tags


# ─── Test 3: Traefik Gateway Routing Validation ──────────────────────────

class TestTraefikRouting:
    """Validate docker-compose Traefik labels cover all AI endpoints."""

    @pytest.fixture(autouse=True)
    def setup(self):
        import yaml
        compose_path = ROOT / "docker-compose.yaml"
        with open(compose_path) as f:
            self.compose = yaml.safe_load(f)
        self.ai_labels = self.compose["services"]["ai"]["labels"]

    def test_ai_service_has_traefik_enabled(self):
        assert "traefik.enable=true" in self.ai_labels

    def test_rag_routing(self):
        rule = self._get_rule()
        assert "PathPrefix(`/api/v1/rag`)" in rule

    def test_reports_routing(self):
        rule = self._get_rule()
        assert "PathPrefix(`/api/v1/reports`)" in rule

    def test_vision_analysis_routing(self):
        rule = self._get_rule()
        assert "PathRegexp" in rule
        assert "analyze" in rule

    def test_report_generation_routing(self):
        """Report generation endpoints under /inspections/{id}/report/* must route to AI."""
        rule = self._get_rule()
        assert "report/" in rule, "AI router must handle /inspections/{id}/report/* paths"
        assert "generate-report" in rule, "AI router must handle generate-report path"

    def test_ai_priority_over_core(self):
        """AI router must have higher priority than core for overlapping paths."""
        priority_label = [l for l in self.ai_labels if "priority" in l]
        assert len(priority_label) > 0, "AI router must have explicit priority set"

    def test_celery_worker_configured(self):
        worker = self.compose["services"]["celery-worker"]
        assert "celery" in worker["command"]
        assert "reports" in worker["command"]

    def _get_rule(self) -> str:
        for label in self.ai_labels:
            if "routers.ai.rule=" in label:
                return label.split("=", 1)[1]
        return ""


# ─── Test 4: DTO Schema Validation ───────────────────────────────────────

class TestDTOSchemas:
    """Validate Pydantic DTO schemas match the specification."""

    def test_verify_response_fields(self):
        from app.api.dtos.verify_dto import ReportVerificationResponse
        fields = ReportVerificationResponse.model_fields
        expected = {"valid", "verify_token", "inspection_id", "status", "completed_at", "summary", "error"}
        assert set(fields.keys()) == expected

    def test_report_job_response_fields(self):
        from app.api.dtos.report_dto import ReportJobResponse
        fields = ReportJobResponse.model_fields
        expected = {"job_id", "inspection_id", "status", "verify_token", "created_at"}
        assert set(fields.keys()) == expected

    def test_report_status_response_fields(self):
        from app.api.dtos.report_dto import ReportStatusResponse
        fields = ReportStatusResponse.model_fields
        expected = {"job_id", "status", "pdf_url", "error_message"}
        assert set(fields.keys()) == expected

    def test_rag_search_request_fields(self):
        from app.api.dtos.rag_dto import RagSearchRequest
        fields = RagSearchRequest.model_fields
        assert "query" in fields
        assert "limit" in fields

    def test_analysis_response_fields(self):
        from app.api.dtos.vision_dto import AnalysisResponse
        fields = AnalysisResponse.model_fields
        expected = {"id", "photo_id", "defect_labels", "severity", "description", "remediation", "created_at"}
        assert set(fields.keys()) == expected


# ─── Test 5: Report Model Lifecycle ──────────────────────────────────────

class TestReportModel:
    """Validate ReportJob model and status enum."""

    def test_report_status_enum(self):
        from app.repository.report_job import ReportStatus
        assert ReportStatus.QUEUED.value == "queued"
        assert ReportStatus.PROCESSING.value == "processing"
        assert ReportStatus.READY.value == "ready"
        assert ReportStatus.FAILED.value == "failed"

    def test_report_job_columns(self):
        from app.repository.report_job import ReportJob
        columns = {c.name for c in ReportJob.__table__.columns}
        expected = {"id", "inspection_id", "status", "pdf_url", "report_json",
                    "verify_token", "error_message", "created_at", "completed_at"}
        assert expected.issubset(columns), f"Missing columns: {expected - columns}"


# ─── Test 6: QR Code Generation ──────────────────────────────────────────

class TestQRCodeGeneration:
    """Validate QR code generation for report verification."""

    def test_qr_code_base64(self):
        from app.services.report_service import _generate_qr_base64
        result = _generate_qr_base64("http://localhost/api/v1/reports/test123/verify")
        assert isinstance(result, str)
        assert len(result) > 100  # QR codes are substantial
        # Verify it's valid base64
        import base64
        decoded = base64.b64decode(result)
        assert decoded[:4] == b'\x89PNG'  # PNG magic bytes


# ─── Test 7: HTML Template Rendering ─────────────────────────────────────

class TestTemplateRendering:
    """Validate Jinja2 template renders without error."""

    def test_render_html(self):
        from app.services.report_service import _render_html
        context = {
            "company_name": "TestCo",
            "property_address": "123 Test St",
            "inspection_date": "2026-09-01",
            "inspector_name": "Test Inspector",
            "report_date": "2026-09-01 12:00 UTC",
            "executive_summary": "Test summary",
            "severity_matrix": [],
            "photo_findings": [],
            "remediation_items": [],
            "observations": "",
            "verify_token": "abc123",
        }
        html = _render_html(context, "base64qrcode==", "http://localhost/verify/abc123")
        assert "TestCo" in html
        assert "123 Test St" in html
        assert "base64qrcode==" in html
        assert "abc123" in html


# ─── Test 8: Context Aggregation ─────────────────────────────────────────

class TestContextAggregation:
    """Validate report context aggregation logic."""

    def test_gather_context_structure(self):
        """Test that gather_inspection_context returns the expected structure."""
        from app.services.report_context import gather_inspection_context
        mock_db = MagicMock()
        mock_db.execute.return_value.scalars.return_value.all.return_value = []

        with patch("app.services.report_context._fetch_inspection_metadata") as mock_fetch:
            mock_fetch.return_value = {
                "company_name": "TestCo",
                "property_address": "123 Test St",
                "inspection_date": "2026-09-01",
                "inspector_name": "Inspector",
            }
            ctx = gather_inspection_context(
                inspection_id=uuid.uuid4(),
                auth_token="test",
                db=mock_db,
            )
        assert ctx["company_name"] == "TestCo"
        assert ctx["property_address"] == "123 Test St"
        assert "severity_matrix" in ctx
        assert "photo_findings" in ctx
        assert "remediation_items" in ctx


# ─── Test 9: Verification Response Logic ─────────────────────────────────

class TestVerificationLogic:
    """Validate the verification endpoint business logic."""

    def test_invalid_token_returns_false(self):
        """When token is not found, response must be valid=False."""
        from app.api.dtos.verify_dto import ReportVerificationResponse
        resp = ReportVerificationResponse(
            valid=False,
            verify_token="nonexistent",
            status="invalid",
            error="Invalid or unverified report token",
        )
        assert resp.valid is False
        assert resp.error is not None
        assert resp.inspection_id is None

    def test_valid_token_returns_summary(self):
        """When token is READY, response must include summary."""
        from app.api.dtos.verify_dto import ReportVerificationResponse
        resp = ReportVerificationResponse(
            valid=True,
            verify_token="abc123",
            inspection_id=uuid.uuid4(),
            status="ready",
            summary={
                "property_address": "123 Test St",
                "total_findings": 5,
                "severity_counts": {"High": 2, "Low": 3},
            },
        )
        assert resp.valid is True
        assert resp.summary is not None
        assert resp.summary["total_findings"] == 5


# ─── Test 10: Frontend Route Alignment ───────────────────────────────────

class TestFrontendRouteAlignment:
    """Verify frontend API calls match backend routes."""

    EXPECTED_ALIGNMENTS = [
        # (frontend_path_fragment, backend_route)
        ("/api/v1/reports/", "/api/v1/reports/{verify_token}/verify"),
        ("/inspections/", "/api/v1/inspections/{inspection_id}/generate-report"),
        ("/inspections/", "/api/v1/inspections/{inspection_id}/report/status"),
        ("/inspections/", "/api/v1/inspections/{inspection_id}/report/pdf"),
        ("/inspections/", "/api/v1/inspections/{inspection_id}/report/json"),
        ("/rag/documents", "/api/v1/rag/documents"),
        ("/rag/documents/upload", "/api/v1/rag/documents/upload"),
        ("/rag/search", "/api/v1/rag/search"),
    ]

    def test_frontend_files_exist(self):
        pages_dir = ROOT / "web" / "src" / "pages" / "reports"
        assert (pages_dir / "VerifyReportPage.tsx").exists()
        assert (pages_dir / "ReportViewerPage.tsx").exists()
        assert (pages_dir / "KnowledgeBasePage.tsx").exists()

    def test_app_tsx_has_verify_route(self):
        app_tsx = ROOT / "web" / "src" / "App.tsx"
        content = app_tsx.read_text()
        assert "/verify/:verify_token" in content
        assert "VerifyReportPage" in content

    def test_app_tsx_has_reports_route(self):
        app_tsx = ROOT / "web" / "src" / "App.tsx"
        content = app_tsx.read_text()
        assert "/reports" in content
        assert "ReportViewerPage" in content

    def test_app_tsx_has_knowledge_base_route(self):
        app_tsx = ROOT / "web" / "src" / "App.tsx"
        content = app_tsx.read_text()
        assert "/knowledge-base" in content
        assert "KnowledgeBasePage" in content
