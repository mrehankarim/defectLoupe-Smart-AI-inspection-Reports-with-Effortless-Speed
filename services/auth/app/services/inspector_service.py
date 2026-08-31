from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repository.company import Company
from app.repository.inspector import Inspector, InspectorType
from app.repository.user import User
from app.utils.password import hash_password
from shared.auth_roles import UserRole
from app.api.dtos.inspector_dtos import (
    CreateCompanyRequest,
    CompanyResponse,
    UpdateCompanyRequest,
    AddInspectorRequest,
    InspectorResponse,
    UpdateInspectorProfileRequest,
)
from app.services.audit_service import record_audit_event


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
    record_audit_event(
        db,
        user.id,
        "company_created",
        {"company_id": str(company.id)},
    )

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
        role=UserRole.INSPECTOR,
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


def update_inspector_profile(
    data: UpdateInspectorProfileRequest,
    user: User,
    db: Session,
) -> InspectorResponse:
    inspector = db.execute(
        select(Inspector).where(Inspector.user_id == user.id)
    ).scalar_one_or_none()
    if not inspector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspector profile not found",
        )

    changes = data.model_dump(exclude_unset=True)
    if not changes:
        return InspectorResponse.model_validate(inspector)

    for field, value in changes.items():
        setattr(inspector, field, value)
    db.commit()
    db.refresh(inspector)
    record_audit_event(
        db,
        user.id,
        "profile_updated",
        {"fields": sorted(changes)},
    )

    return InspectorResponse.model_validate(inspector)


def update_company_settings(
    data: UpdateCompanyRequest,
    company: Company,
    user: User,
    db: Session,
) -> CompanyResponse:
    changes = data.model_dump(exclude_unset=True)
    if not changes:
        return CompanyResponse.model_validate(company)

    if "email" in changes:
        existing_company = db.execute(
            select(Company).where(
                Company.email == changes["email"],
                Company.id != company.id,
            )
        ).scalar_one_or_none()
        if existing_company:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Company email already registered",
            )

    for field, value in changes.items():
        setattr(company, field, value)
    db.commit()
    db.refresh(company)
    record_audit_event(
        db,
        user.id,
        "company_settings_updated",
        {"company_id": str(company.id), "fields": sorted(changes)},
    )

    return CompanyResponse.model_validate(company)
