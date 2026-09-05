"""Vision AI service — Gemini 1.5 Flash defect analysis for inspection photos.

Uses the Gemini REST API (via httpx) for maximum compatibility.  Falls back
to the ``google-generativeai`` SDK when available.  Results are cached in the
``photo_analyses`` table to avoid redundant API calls.
"""
import base64
import json
import logging
import os
from uuid import UUID

import httpx
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repository.photo_analysis import PhotoAnalysis

logger = logging.getLogger(__name__)

# ── Configuration ────────────────────────────────────────────────────────────

_GEMINI_API_KEY: str | None = None
_GEMINI_MODEL: str | None = None
_GEMINI_URL: str | None = None

ANALYSIS_PROMPT = """\
You are an expert building inspector analysing a property inspection photo.

Inspect the image carefully and identify any visible defects, damage, or
maintenance issues.  Return your analysis as **valid JSON** (no markdown,
no code fences) with exactly these keys:

{
  "defect_labels": ["label1", "label2", ...],
  "severity": "Low | Medium | High | Critical",
  "description": "A detailed description of what you observe, including the \
specific locations and types of defects found.",
  "remediation": "Recommended remediation steps and repairs."
}

Rules:
- severity must be exactly one of: Low, Medium, High, Critical
- defect_labels must be a non-empty list of short strings
- If no defects are visible, set severity to "Low", defect_labels to \
["No visible defects"], and describe the overall condition.
"""


def _get_config() -> tuple[str, str, str]:
    """Return (api_key, model, url), reading from env on first call."""
    global _GEMINI_API_KEY, _GEMINI_MODEL, _GEMINI_URL
    if _GEMINI_API_KEY is None:
        _GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
        _GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        _GEMINI_URL = (
            f"https://generativelanguage.googleapis.com/v1beta/"
            f"models/{_GEMINI_MODEL}:generateContent"
        )
    return _GEMINI_API_KEY, _GEMINI_MODEL, _GEMINI_URL


# ── Gemini API call ─────────────────────────────────────────────────────────


def _call_gemini_rest(image_bytes: bytes, mime_type: str) -> dict:
    """Call Gemini 1.5 Flash via the REST API and return parsed JSON."""
    api_key, _model, url = _get_config()
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

    b64_image = base64.standard_b64encode(image_bytes).decode("ascii")

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": ANALYSIS_PROMPT},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": b64_image,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 512,
            "responseMimeType": "application/json",
        },
    }

    try:
        resp = httpx.post(
            url,
            params={"key": api_key},
            json=payload,
            timeout=60.0,
        )
        resp.raise_for_status()
        data = resp.json()
    except httpx.HTTPStatusError as exc:
        logger.error("Gemini API error: %s — %s", exc.response.status_code, exc.response.text)
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API returned {exc.response.status_code}",
        )
    except Exception as exc:
        logger.error("Gemini API request failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"Gemini API request failed: {exc}")

    # Extract the text from Gemini's response structure
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as exc:
        logger.error("Unexpected Gemini response structure: %s", data)
        raise HTTPException(status_code=502, detail="Unexpected response structure from Gemini.")

    # Parse the JSON response from Gemini
    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        # Try to extract JSON from markdown code fences
        cleaned = text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            lines = [l for l in lines if not l.startswith("```")]
            cleaned = "\n".join(lines)
        result = json.loads(cleaned)

    return result


def _call_gemini_sdk(image_bytes: bytes, mime_type: str) -> dict:
    """Call Gemini via the google-generativeai SDK (deferred import)."""
    import google.generativeai as genai

    api_key, model_name, _ = _get_config()
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)

    image_part = {"mime_type": mime_type, "data": image_bytes}
    try:
        response = model.generate_content(
            [ANALYSIS_PROMPT, image_part],
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                max_output_tokens=1024,
                response_mime_type="application/json",
            ),
        )
        return json.loads(response.text)
    except Exception as exc:
        logger.error("Gemini SDK request failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"Gemini API request failed: {exc}")


def _call_gemini(image_bytes: bytes, mime_type: str) -> dict:
    """Try the SDK first; fall back to REST on error."""
    try:
        return _call_gemini_sdk(image_bytes, mime_type)
    except Exception as exc:
        logger.warning("Gemini SDK call failed (%s); attempting direct REST fallback", exc)
        return _call_gemini_rest(image_bytes, mime_type)


# ── Public API ───────────────────────────────────────────────────────────────


def analyze_photo(
    photo_id: UUID,
    image_bytes: bytes,
    mime_type: str,
    db: Session,
) -> PhotoAnalysis:
    """Analyse a photo for defects, caching results in ``photo_analyses``.

    If an analysis already exists for *photo_id*, return it directly
    to avoid hitting Gemini rate limits.
    """
    # Check cache first
    existing = db.execute(
        select(PhotoAnalysis).where(PhotoAnalysis.photo_id == photo_id)
    ).scalar_one_or_none()

    if existing is not None:
        logger.info("Cache hit for photo_id=%s", photo_id)
        return existing

    # Call Gemini
    result = _call_gemini(image_bytes, mime_type)

    # Validate required fields
    defect_labels = result.get("defect_labels", ["Unknown"])
    severity = result.get("severity", "Low")
    description = result.get("description", "No description provided.")
    remediation = result.get("remediation", "No remediation provided.")

    if severity not in ("Low", "Medium", "High", "Critical"):
        severity = "Low"

    record = PhotoAnalysis(
        photo_id=photo_id,
        defect_labels=defect_labels if isinstance(defect_labels, (list, dict)) else [str(defect_labels)],
        severity=severity,
        description=str(description),
        remediation=str(remediation),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    logger.info("Analysed photo_id=%s — severity=%s", photo_id, severity)
    return record


def get_analysis(
    photo_id: UUID,
    db: Session,
) -> PhotoAnalysis | None:
    """Retrieve a stored analysis by *photo_id*, or ``None`` if not found."""
    return db.execute(
        select(PhotoAnalysis).where(PhotoAnalysis.photo_id == photo_id)
    ).scalar_one_or_none()
