from uuid import UUID

from fastapi import Depends, HTTPException, status

from app.utils.security import UserContext, get_current_user_context


def get_tenant_filter(
    context: UserContext = Depends(get_current_user_context),
) -> dict[str, UUID]:
    if context.company_id:
        return {"company_id": context.company_id}
    if context.inspector_id:
        return {"inspector_id": context.inspector_id}
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Inspector profile not found",
    )
