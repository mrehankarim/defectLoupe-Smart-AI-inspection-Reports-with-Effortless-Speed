"""Celery task: transcribe audio using faster-whisper.

This worker picks up audio from Cloudinary (or local storage), runs
speech-to-text with faster-whisper, and writes the result to the
``transcriptions`` table.

Usage:
    celery -A app.celery_app worker -l info -Q stt
"""
import logging
import os

from app.celery_app import celery_app
from app.utils.config import WHISPER_MODEL

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.workers.transcribe_worker.transcribe_audio",
    bind=True,
    max_retries=3,
    default_retry_delay=10,
    queue="stt",
)
def transcribe_audio(self, observation_id: str, audio_url: str):
    """Download audio, run faster-whisper, store transcription.

    Parameters
    ----------
    observation_id : str
        UUID of the AreaObservation row (as a string for JSON serialisation).
    audio_url : str
        Public URL or local path to the audio file.
    """
    logger.info("Starting transcription for observation %s", observation_id)

    try:
        # 1. Download audio to a temporary file
        from app.utils.storage import download_to_temp
        local_path = download_to_temp(audio_url, suffix=".wav")

        # 2. Run faster-whisper
        from faster_whisper import WhisperModel

        model_size = WHISPER_MODEL
        logger.info("Loading Whisper model: %s", model_size)
        model = WhisperModel(model_size, device="cpu", compute_type="int8")

        segments, info = model.transcribe(local_path, beam_size=5)
        text_parts = [segment.text for segment in segments]
        transcription_text = " ".join(text_parts).strip()

        # 3. Clean up temp file
        try:
            os.unlink(local_path)
        except OSError:
            pass

        if not transcription_text:
            transcription_text = "[No speech detected]"

        # 4. Write result to database
        from shared.db_config import SessionLocal
        from app.repository.transcription import Transcription
        from uuid import UUID

        db = SessionLocal()
        try:
            txn = Transcription(
                observation_id=UUID(observation_id),
                transcription_text=transcription_text,
                confidence=1.0,  # faster-whisper doesn't provide per-file confidence easily
            )
            db.add(txn)
            db.commit()
            logger.info(
                "Transcription completed for observation %s (%d chars)",
                observation_id,
                len(transcription_text),
            )
        finally:
            db.close()

        return {
            "observation_id": observation_id,
            "status": "completed",
            "text_length": len(transcription_text),
        }

    except Exception as exc:
        logger.exception("Transcription failed for observation %s", observation_id)
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=self.default_retry_delay * (2 ** self.request.retries))
