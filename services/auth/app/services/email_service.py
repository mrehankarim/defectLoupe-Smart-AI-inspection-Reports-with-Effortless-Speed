"""
Email delivery service using the Resend API (v2.x).
"""
import logging

import resend

from app.utils.config_loader import (
    get_resend_api_key,
    get_email_from_address,
    get_app_base_url,
)
from app.utils.email_templates import (
    verification_email_html,
    verification_email_text,
)

logger = logging.getLogger(__name__)

VERIFICATION_LINK_EXPIRY_HOURS = 24


def build_verification_link(token: str) -> str:
    """Build the full URL the user will click to verify their email."""
    base_url = get_app_base_url().rstrip("/")
    return f"{base_url}/auth/verify-email?token={token}"


def send_verification_email(
    to_email: str,
    user_name: str,
    token: str,
) -> None:
    """
    Send an email-verification message via Resend.
    Raises on API failure so callers can decide whether to retry or surface an error.
    """
    link = build_verification_link(token)
    logger.warning("==================================================")
    logger.warning("VERIFICATION LINK FOR %s: %s", to_email, link)
    logger.warning("==================================================")

    html_body = verification_email_html(
        user_name=user_name,
        verification_link=link,
        expiry_hours=VERIFICATION_LINK_EXPIRY_HOURS,
    )
    text_body = verification_email_text(
        user_name=user_name,
        verification_link=link,
        expiry_hours=VERIFICATION_LINK_EXPIRY_HOURS,
    )

    try:
        resend.api_key = get_resend_api_key()
        result = resend.Emails.send({
            "from": get_email_from_address(),
            "to": to_email,
            "subject": "Verify your DefectLoupe email address",
            "html": html_body,
            "text": text_body,
        })
        logger.info("Verification email sent via Resend to %s (id=%s)", to_email, result.get("id"))
    except Exception as exc:
        logger.error("Resend email delivery failed for %s: %s", to_email, exc)
        logger.warning(
            "Use the logged verification link above to verify this account directly in local development: %s",
            link,
        )
        raise exc
