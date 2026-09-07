"""Report service — PDF compilation pipeline.

Orchestrates context gathering, Gemini narrative synthesis, QR code
generation, Jinja2 HTML rendering, and WeasyPrint PDF output.
"""
import base64
import io
import json
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session

from app.repository.report_job import ReportJob, ReportStatus
from app.services.report_context import gather_inspection_context

logger = logging.getLogger(__name__)

# Directory for generated PDFs
REPORTS_DIR = Path(__file__).resolve().parents[2] / "reports"


def _ensure_reports_dir() -> Path:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    return REPORTS_DIR


def _generate_qr_base64(verify_url: str) -> str:
    """Generate a QR code PNG and return it as a base64 string."""
    import qrcode

    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(verify_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def _render_html(context: dict, qr_code_data: str, verify_url: str) -> str:
    """Render the Jinja2 report template."""
    from jinja2 import Environment, FileSystemLoader

    templates_dir = Path(__file__).resolve().parents[2] / "templates"
    env = Environment(loader=FileSystemLoader(str(templates_dir)), autoescape=True)
    template = env.get_template("report_template.html")
    return template.render(context=context, qr_code_data=qr_code_data, verify_url=verify_url)


def _render_pdf(html_string: str) -> bytes:
    """Render HTML to PDF bytes using WeasyPrint (deferred import)."""
    import weasyprint
    return weasyprint.HTML(string=html_string).write_pdf()


def build_report_narrative(context: dict) -> dict:
    """Use Gemini 1.5 Flash to synthesise an executive summary.

    Falls back to a simple summary if the API is unreachable.
    """
    findings = context.get("photo_findings", [])
    if not findings:
        context["executive_summary"] = context.get("executive_summary", "No defects were identified during this inspection.")
        return context

    # Build a text summary of findings for Gemini
    findings_text = "\n".join(
        f"- [{f.get('severity', 'Low')}] {', '.join(f.get('defect_labels', ['N/A']))}: {f.get('description', '')}"
        for f in findings[:10]
    )

    prompt = f"""\
Based on the following inspection findings, write a concise executive summary \
(2-3 sentences) for a property inspection report:

{findings_text}

Return ONLY the summary text, no JSON, no markdown.
"""
    try:
        from app.services.vision_service import _call_gemini, _get_config
        api_key, model_name, url = _get_config()
        if not api_key:
            raise ValueError("No API key")

        import httpx
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 256},
        }
        resp = httpx.post(
            url, params={"key": api_key}, json=payload, timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()
        summary = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        context["executive_summary"] = summary
    except Exception as exc:
        logger.warning("Gemini narrative synthesis failed: %s", exc)
        severities = [f.get("severity", "Low") for f in findings]
        critical_count = severities.count("Critical") + severities.count("High")
        context["executive_summary"] = (
            f"This inspection identified {len(findings)} findings, "
            f"including {critical_count} high-severity items requiring attention."
        )

    return context


def generate_pdf_report(
    job_id: UUID,
    db: Session,
) -> None:
    """Full PDF generation pipeline for a ReportJob.

    1. Fetch the ReportJob row.
    2. Generate verify_token and QR code.
    3. Gather inspection context.
    4. Build narrative via Gemini.
    5. Render HTML → PDF.
    6. Update ReportJob to READY.
    """
    job = db.get(ReportJob, job_id)
    if job is None:
        raise ValueError(f"ReportJob {job_id} not found")

    inspection_id = job.inspection_id

    # Generate verify token and URL
    verify_token = uuid.uuid4().hex
    public_verify_base = os.getenv("PUBLIC_VERIFY_URL", "http://localhost/verify").rstrip("/")
    if public_verify_base.endswith("/verify"):
        verify_url = f"{public_verify_base}/{verify_token}"
    elif "/verify/" in public_verify_base:
        verify_url = f"{public_verify_base}/{verify_token}"
    else:
        verify_url = f"{public_verify_base}/{verify_token}/verify"

    # QR code
    qr_code_data = _generate_qr_base64(verify_url)

    # Gather context (pass empty auth token — in prod this would come from the job)
    context = gather_inspection_context(
        inspection_id=inspection_id,
        auth_token="",
        db=db,
    )
    context["verify_token"] = verify_token

    # Build narrative
    context = build_report_narrative(context)

    # Render HTML
    html_string = _render_html(context, qr_code_data, verify_url)

    # Render PDF
    reports_dir = _ensure_reports_dir()
    pdf_path = reports_dir / f"{job_id}.pdf"

    try:
        pdf_bytes = _render_pdf(html_string)
        pdf_path.write_bytes(pdf_bytes)
    except Exception as exc:
        # WeasyPrint may not be available — save HTML as fallback
        logger.warning("WeasyPrint PDF rendering failed, saving HTML fallback: %s", exc)
        pdf_path = reports_dir / f"{job_id}.html"
        pdf_path.write_bytes(html_string.encode("utf-8"))
        pdf_bytes = None

    # Update job
    job.verify_token = verify_token
    job.status = ReportStatus.READY
    job.pdf_url = str(pdf_path)
    job.report_json = json.loads(json.dumps(context, default=str))
    job.completed_at = datetime.now(timezone.utc)
    db.commit()

    logger.info("Report %s generated: %s", job_id, pdf_path)
