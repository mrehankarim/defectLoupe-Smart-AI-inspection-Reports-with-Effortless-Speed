from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from shared._company_model import Company
from shared._inspector_model import Inspector, InspectorType
from shared._user_model import User
from shared.password import hash_password
from app.api.dtos.inspector_dtos import (
    CreateCompanyRequest,
    CompanyResponse,
    AddInspectorRequest,
    InspectorResponse,
)


def create_company(
    data: CreateCompanyRequest,
    user: User,
    db: Session,
) -> CompanyResponse:
    """
    Create a company and make the current user the owner.
    The inspector profile is guaranteed to exist from registration.
    """
    inspector = db.execute(
        select(Inspector).where(Inspector.user_id == user.id)
    ).scalar_one_or_none()

    if not inspector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspector profile not found",
        )

    if inspector.company_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already associated with a company",
        )

    company = Company(
        name=data.name,
        email=data.email,
        phone_number=data.phone_number,
        website=data.website,
        address=data.address,
        city=data.city,
        state=data.state,
        zip_code=data.zip_code,
        country=data.country,
        owner_id=inspector.id,
    )
    db.add(company)
    db.flush()  # gets company.id

    # Link inspector → company
    inspector.company_id = company.id
    inspector.inspector_type = InspectorType.AGENCY_MEMBER
    db.commit()
    db.refresh(company)

    return CompanyResponse.model_validate(company)


def add_inspector_to_company(
    data: AddInspectorRequest,
    owner_company: Company,
    db: Session,
) -> InspectorResponse:
    """
    Add a new inspector to the owner's company.
    Creates a User account and Inspector profile in one step.
    Only the company owner can call this.
    """
    # Check email uniqueness
    existing_user = db.execute(
        select(User).where(User.email == data.email)
    ).scalar_one_or_none()
    if existing_user:
        # Ensure they aren't already an inspector
        existing_inspector = db.execute(
            select(Inspector).where(Inspector.user_id == existing_user.id)
        ).scalar_one_or_none()
        if existing_inspector:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An inspector with this email already exists",
            )

    # Create user account
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.flush()

    # Create inspector linked to the company
    inspector = Inspector(
        user_id=user.id,
        company_id=owner_company.id,
        first_name=data.first_name,
        last_name=data.last_name,
        phone_number=data.phone_number,
        license_number=data.license_number,
        inspector_type=InspectorType.AGENCY_MEMBER,
    )
    db.add(inspector)
    db.commit()
    db.refresh(inspector)

    return InspectorResponse.model_validate(inspector)


def get_company_inspectors(
    company: Company,
    db: Session,
) -> list[InspectorResponse]:
    """List all inspectors belonging to a company."""
    inspectors = db.execute(
        select(Inspector).where(Inspector.company_id == company.id)
    ).scalars().all()
    return [InspectorResponse.model_validate(i) for i in inspectors]
