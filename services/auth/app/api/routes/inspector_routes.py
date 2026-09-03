from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from shared.db_config import get_db
from shared._user_model import User
from shared._company_model import Company
from shared._inspector_model import Inspector
from app.api.dtos.inspector_dtos import (
    CreateCompanyRequest,
    CompanyResponse,
    AddInspectorRequest,
    InspectorResponse,
    ProfileResponse,
)
from app.services.auth_service import get_current_user
from app.services.inspector_service import (
    create_company as svc_create_company,
    add_inspector_to_company,
    get_company_inspectors,
)

router = APIRouter(prefix="/inspectors", tags=["inspectors"])



@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the logged-in user's inspector profile and ownership status."""
    inspector = db.execute(
        select(Inspector).where(Inspector.user_id == current_user.id)
    ).scalar_one_or_none()

    is_owner = False
    if inspector and inspector.company_id:
        company = db.get(Company, inspector.company_id)
        is_owner = company is not None and company.owner_id == inspector.id

    return ProfileResponse(
        user_id=current_user.id,
        email=current_user.email,
        inspector=InspectorResponse.model_validate(inspector) if inspector else None,
        is_company_owner=is_owner,
    )



@router.post("/company", response_model=CompanyResponse, status_code=201)
def create_company_endpoint(
    data: CreateCompanyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a company. The logged-in user becomes the company owner
    and can later add other inspectors.
    """
    return svc_create_company(data, current_user, db)


@router.get("/company", response_model=CompanyResponse)
def get_my_company(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the company the logged-in user belongs to."""
    inspector = db.execute(
        select(Inspector).where(Inspector.user_id == current_user.id)
    ).scalar_one_or_none()

    if not inspector or not inspector.company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not associated with any company",
        )

    company = db.get(Company, inspector.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanyResponse.model_validate(company)



@router.post("/company/inspectors", response_model=InspectorResponse, status_code=201)
def add_inspector(
    data: AddInspectorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Add a new inspector to the company.
    Only the company owner can perform this action.
    """
    # Resolve the owner's inspector record
    owner_inspector = db.execute(
        select(Inspector).where(Inspector.user_id == current_user.id)
    ).scalar_one_or_none()

    if not owner_inspector or not owner_inspector.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a company member",
        )

    company = db.get(Company, owner_inspector.company_id)
    if not company or company.owner_id != owner_inspector.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the company owner can add inspectors",
        )

    return add_inspector_to_company(
        data, company, db
    )


@router.get("/company/inspectors", response_model=list[InspectorResponse])
def list_company_inspectors(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all inspectors in the logged-in user's company."""
    inspector = db.execute(
        select(Inspector).where(Inspector.user_id == current_user.id)
    ).scalar_one_or_none()

    if not inspector or not inspector.company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not associated with any company",
        )

    company = db.get(Company, inspector.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return get_company_inspectors(company, db)
