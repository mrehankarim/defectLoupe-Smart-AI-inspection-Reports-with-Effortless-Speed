"""Cloudinary storage abstraction with local-file fallback for dev.

Usage:
    from app.utils.storage import upload_photo, upload_audio, delete_file, get_url

When Cloudinary credentials are present the SDK is used.  Otherwise files are
saved to a local ``uploads/`` directory so the service can run without any
external dependency during early development.
"""
import logging
import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.utils.config import LOCAL_UPLOAD_DIR, is_cloudinary_configured

logger = logging.getLogger(__name__)

# ── Allowed MIME types ─────────────────────────────────────────────────────
IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
AUDIO_MIMES = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm",
    "audio/mp4", "audio/x-m4a", "audio/aac", "audio/flac",
}


# ── Helpers ────────────────────────────────────────────────────────────────

def _local_save(file_bytes: bytes, folder: str, extension: str) -> str:
    """Save bytes to the local uploads/<folder>/ directory and return the path."""
    dest_dir = LOCAL_UPLOAD_DIR / folder
    dest_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4()}{extension}"
    dest = dest_dir / filename
    dest.write_bytes(file_bytes)
    logger.info("Saved file locally: %s", dest)
    return str(dest)


def _local_delete(path: str) -> None:
    """Remove a locally stored file."""
    p = Path(path)
    if p.exists():
        p.unlink()
        logger.info("Deleted local file: %s", p)


# ── Public API ─────────────────────────────────────────────────────────────

async def upload_photo(file: UploadFile) -> str:
    """Upload an image to Cloudinary (or local fallback) and return the URL.

    Raises ValueError for unsupported MIME types.
    """
    if file.content_type and file.content_type not in IMAGE_MIMES:
        raise ValueError(f"Unsupported image type: {file.content_type}")

    file_bytes = await file.read()

    if is_cloudinary_configured():
        import cloudinary.uploader
        result = cloudinary.uploader.upload(
            file_bytes,
            folder="defectloupe/photos",
            resource_type="image",
        )
        url: str = result["secure_url"]
        logger.info("Uploaded photo to Cloudinary: %s", url)
        return url

    # Local fallback
    ext = Path(file.filename or "photo.jpg").suffix or ".jpg"
    return _local_save(file_bytes, "photos", ext)


async def upload_audio(file: UploadFile) -> str:
    """Upload an audio file to Cloudinary (or local fallback) and return the URL.

    Raises ValueError for unsupported MIME types.
    """
    if file.content_type and file.content_type not in AUDIO_MIMES:
        raise ValueError(f"Unsupported audio type: {file.content_type}")

    file_bytes = await file.read()

    if is_cloudinary_configured():
        import cloudinary.uploader
        result = cloudinary.uploader.upload(
            file_bytes,
            folder="defectloupe/audio",
            resource_type="raw",
        )
        url: str = result["secure_url"]
        logger.info("Uploaded audio to Cloudinary: %s", url)
        return url

    # Local fallback
    ext = Path(file.filename or "audio.mp3").suffix or ".mp3"
    return _local_save(file_bytes, "audio", ext)


def delete_file(url_or_path: str) -> None:
    """Delete a file from Cloudinary or local storage.

    If the string looks like a Cloudinary URL, extract the public_id and
    destroy it.  Otherwise treat it as a local path.
    """
    if "cloudinary" in url_or_path or "res.cloudinary.com" in url_or_path:
        if is_cloudinary_configured():
            import cloudinary.uploader
            # Extract public_id from URL
            # e.g. https://res.cloudinary.com/<cloud>/image/upload/v123/defectloupe/photos/abc.jpg
            try:
                parts = url_or_path.split("/")
                # Find the folder/filename after the version segment
                upload_idx = parts.index("upload")
                # Skip version (v123...) if present
                remainder = parts[upload_idx + 1:]
                if remainder and remainder[0].startswith("v") and remainder[0][1:].isdigit():
                    remainder = remainder[1:]
                public_id = "/".join(remainder)
                # Strip extension for image type
                if public_id.endswith((".jpg", ".png", ".webp", ".heic", ".heif")):
                    public_id = public_id.rsplit(".", 1)[0]
                    cloudinary.uploader.destroy(public_id)
                else:
                    cloudinary.uploader.destroy(public_id, resource_type="raw")
                logger.info("Deleted from Cloudinary: %s", public_id)
            except Exception as exc:
                logger.warning("Cloudinary delete failed for %s: %s", url_or_path, exc)
    else:
        _local_delete(url_or_path)


def get_url(url_or_path: str) -> str:
    """Return a publicly accessible URL for a stored file.

    Cloudinary URLs are already public.  For local files we just return the
    path (in production this would be proxied through the backend).
    """
    return url_or_path


def download_to_temp(url_or_path: str, suffix: str = "") -> str:
    """Download a file to a temporary location and return the local path.

    Used by the Celery transcription worker to fetch audio before running
    faster-whisper.
    """
    import tempfile

    if "cloudinary" in url_or_path or "res.cloudinary.com" in url_or_path:
        import httpx
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        with httpx.Client(follow_redirects=True) as client:
            resp = client.get(url_or_path)
            resp.raise_for_status()
            tmp.write(resp.content)
        tmp.close()
        return tmp.name

    # Local file — just return the path
    return url_or_path
