import logging
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.repository.audit_log import AuditLog


logger = logging.getLogger(__name__)


def record_audit_event(
    db: Session,
    user_id: UUID | None,
    action: str,
    details: dict[str, Any] | None = None,
) -> None:
    try:
        db.add(AuditLog(user_id=user_id, action=action, details=details))
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to record audit event: %s", action)
