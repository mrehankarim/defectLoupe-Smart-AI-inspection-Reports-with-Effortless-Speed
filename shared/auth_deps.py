"""Shared FastAPI dependencies for JWT-based authentication.

Each service imports these helpers to decode the JWT locally using
the same ACCESS_TOKEN_SECRET — no cross-service HTTP call needed.
"""
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

import jwt as pyjwt
from fastapi import Request, HTTPException, status, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from shared.auth_roles import UserRole, effective_role
from shared.db_config import get_db


ACCESS_COOKIE = "access_token"


def _get_secret() -> str:
    secret = os.getenv("ACCESS_TOKEN_SECRET")
    if not secret:
        raise RuntimeError("ACCESS_TOKEN_SECRET is not set")
    return secret


def _decode_token(token: str) -> dict:
    return pyjwt.decode(token, _get_secret(), algorithms=["HS256"])


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
):
    """Decode the JWT from the access_token cookie and return the User row."""
    from shared._user_model import User  # local import to avoid circular deps

    token = request.cookies.get(ACCESS_COOKIE)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = _decode_token(token)
        user_id = payload.get("sub")
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
        )

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    return user


def get_current_inspector(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return the Inspector profile for the currently logged-in user."""
    from shared._inspector_model import Inspector  # local import

    inspector = db.execute(
        select(Inspector).where(Inspector.user_id == current_user.id)
    ).scalar_one_or_none()

    if not inspector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspector profile not found",
        )
    return inspector


def get_tenant_filter(inspector):
    """Return the appropriate filter for tenant-scoped queries.

    - Solo inspector → filter by inspector_id
    - Agency member → filter by company_id
    """
    if inspector.company_id:
        return {"company_id": inspector.company_id}
    return {"inspector_id": inspector.id}


@dataclass(frozen=True)
class UserContext:
    user_id: UUID
    email: str
    role: UserRole
    company_id: UUID | None
    inspector_id: UUID | None


def get_current_user_context(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserContext:
    from shared._inspector_model import Inspector

    inspector = db.execute(
        select(Inspector).where(Inspector.user_id == current_user.id)
    ).scalar_one_or_none()
    return UserContext(
        user_id=current_user.id,
        email=current_user.email,
        role=effective_role(current_user.role, current_user.is_admin),
        company_id=inspector.company_id if inspector else None,
        inspector_id=inspector.id if inspector else None,
    )


def get_current_company(
    context: UserContext = Depends(get_current_user_context),
    db: Session = Depends(get_db),
):
    from shared._company_model import Company

    if not context.company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not associated with a company",
        )
    company = db.get(Company, context.company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )
    return company


def require_company_owner(
    context: UserContext = Depends(get_current_user_context),
    company=Depends(get_current_company),
):
    if context.inspector_id != company.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the company owner can perform this action",
        )
    return company


def require_role(*roles: UserRole | str):
    allowed_roles = {UserRole(role) for role in roles}

    def dependency(
        context: UserContext = Depends(get_current_user_context),
    ) -> UserContext:
        if context.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return context

    return dependency
