from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config.db_config import get_db
from app.repository.company import Company
from app.repository.inspector import Inspector
from app.repository.user import User
from app.services.auth_service import get_current_user
from shared.auth_roles import UserRole, effective_role


@dataclass(frozen=True)
class UserContext:
    user_id: UUID
    email: str
    role: UserRole
    company_id: UUID | None
    inspector_id: UUID | None


def get_current_user_context(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserContext:
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
) -> Company:
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
    company: Company = Depends(get_current_company),
) -> Company:
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
