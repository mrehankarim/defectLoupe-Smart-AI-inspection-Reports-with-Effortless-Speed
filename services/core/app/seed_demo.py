"""Seed the database with realistic demo data for the hackathon demo.

Run with: python -m app.seed_demo
(or: uvicorn app.main:app first, then call POST /api/v1/demo/seed)
"""
import os
import sys
from uuid import uuid4
from pathlib import Path
from dotenv import load_dotenv

# Load env
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

from shared.db_config import SessionLocal
from shared.base import Base
from shared.db_config import engine

from shared._user_model import User  # noqa: F401
from shared._inspector_model import Inspector  # noqa: F401
from shared._company_model import Company  # noqa: F401

# Import all models
from app.repository.client import Client
from app.repository.property import Property, PropertyType
from app.repository.inspection import Inspection, InspectionStatus
from app.repository.inspection_area import InspectionArea
from app.repository.area_template import AreaTemplate


def seed_demo_data():
    """Insert realistic demo data into the database."""
    db = SessionLocal()

    try:
        # Create all tables first
        Base.metadata.create_all(bind=engine)

        # Check if data already exists
        if db.query(Client).count() > 0:
            print("Demo data already exists. Skipping seed.")
            db.close()
            return

        # Create a demo inspector + user so FK constraints are satisfied
        from shared._user_model import User
        from shared._inspector_model import Inspector, InspectorType
        from shared.password import hash_password

        demo_user = User(
            email="demo@defectloupe.com",
            hashed_password=hash_password("demo1234"),
            email_verified=True,
            is_active=True,
        )
        db.add(demo_user)
        db.flush()

        demo_inspector = Inspector(
            user_id=demo_user.id,
            first_name="Demo",
            last_name="Inspector",
            inspector_type=InspectorType.INDIVIDUAL,
        )
        db.add(demo_inspector)
        db.flush()

        inspector_id = demo_inspector.id
        company_id = None  # Solo inspector for demo

        print(f"Seeding demo data with inspector_id={inspector_id}")

        # ── Clients ──────────────────────────────────────────────────────
        clients = [
            Client(first_name="Ahmed", last_name="Khan", email="ahmed.khan@example.com",
                   phone_number="+92-300-1234567", inspector_id=inspector_id, company_id=company_id),
            Client(first_name="Sara", last_name="Ali", email="sara.ali@example.com",
                   phone_number="+92-321-9876543", inspector_id=inspector_id, company_id=company_id),
            Client(first_name="Bilal", last_name="Ahmed", email="bilal@example.com",
                   phone_number="+92-333-5551234", inspector_id=inspector_id, company_id=company_id),
        ]
        for c in clients:
            db.add(c)
        db.flush()

        # ── Properties ───────────────────────────────────────────────────
        properties = [
            Property(client_id=clients[0].id, address="42 DHA Phase 5", city="Lahore",
                     state="Punjab", zip_code="54000", country="PK",
                     property_type=PropertyType.RESIDENTIAL, year_built=2015, square_footage=3500),
            Property(client_id=clients[0].id, address="18 Model Town", city="Lahore",
                     state="Punjab", zip_code="54000", country="PK",
                     property_type=PropertyType.RESIDENTIAL, year_built=2008, square_footage=2800),
            Property(client_id=clients[1].id, address="Plot 7, Blue Area", city="Islamabad",
                     state="ICT", zip_code="44000", country="PK",
                     property_type=PropertyType.COMMERCIAL, year_built=2020, square_footage=5000),
            Property(client_id=clients[2].id, address="House 15, Bahria Town", city="Rawalpindi",
                     state="Punjab", zip_code="46000", country="PK",
                     property_type=PropertyType.RESIDENTIAL, year_built=2018, square_footage=4200),
        ]
        for p in properties:
            db.add(p)
        db.flush()

        # ── Inspections ──────────────────────────────────────────────────
        inspections = [
            Inspection(inspector_id=inspector_id, property_id=properties[0].id,
                       title="Pre-Purchase Inspection — DHA Villa",
                       status=InspectionStatus.COMPLETED,
                       notes="Client considering purchase. Full structural review."),
            Inspection(inspector_id=inspector_id, property_id=properties[1].id,
                       title="Annual Maintenance Check",
                       status=InspectionStatus.IN_PROGRESS,
                       notes="Routine annual inspection."),
            Inspection(inspector_id=inspector_id, property_id=properties[2].id,
                       title="Commercial Space Safety Audit",
                       status=InspectionStatus.SCHEDULED,
                       notes="Fire safety and structural audit."),
            Inspection(inspector_id=inspector_id, property_id=properties[3].id,
                       title="New Construction Final Inspection",
                       status=InspectionStatus.DRAFT,
                       notes="Final walkthrough before handover."),
            Inspection(inspector_id=inspector_id, property_id=properties[0].id,
                       title="Follow-up: Roof Repair Verification",
                       status=InspectionStatus.REPORT_GENERATED,
                       notes="Verifying roof repairs from previous inspection."),
        ]
        for insp in inspections:
            db.add(insp)
        db.flush()

        # ── Areas for first inspection ──────────────────────────────────
        area_names = ["Roof", "Kitchen", "Bathroom", "Electrical Panel", "HVAC",
                      "Foundation", "Exterior Walls", "Garage"]
        for idx, name in enumerate(area_names, start=1):
            area = InspectionArea(
                inspection_id=inspections[0].id,
                name=name,
                display_order=idx,
            )
            db.add(area)

        # ── Areas for second inspection ─────────────────────────────────
        for idx, name in enumerate(["Living Room", "Bedrooms", "Plumbing", "Windows"], start=1):
            area = InspectionArea(
                inspection_id=inspections[1].id,
                name=name,
                display_order=idx,
            )
            db.add(area)

        # ── Built-in templates ──────────────────────────────────────────
        templates = [
            AreaTemplate(name="Standard Residential", description="Common areas for residential inspection",
                         area_names=["Roof", "Foundation", "Exterior Walls", "Interior Walls",
                                     "Kitchen", "Bathrooms", "Electrical Panel", "HVAC",
                                     "Plumbing", "Garage", "Windows & Doors", "Flooring"],
                         inspector_id=inspector_id, is_global=True),
            AreaTemplate(name="Commercial", description="Areas for commercial property inspection",
                         area_names=["Roof", "Foundation", "Exterior", "Lobby & Common Areas",
                                     "Office Spaces", "Restrooms", "Electrical Systems",
                                     "HVAC", "Plumbing", "Fire Safety", "Parking Structure",
                                     "Loading Dock", "Elevator", "Storage Areas"],
                         inspector_id=inspector_id, is_global=True),
            AreaTemplate(name="Pre-Purchase", description="Thorough inspection for property purchase",
                         area_names=["Roof", "Foundation", "Exterior", "Interior",
                                     "Kitchen", "Bathrooms", "Electrical", "Plumbing",
                                     "HVAC", "Windows & Doors", "Insulation",
                                     "Garage", "Drainage & Grading"],
                         inspector_id=inspector_id, is_global=True),
        ]
        for t in templates:
            db.add(t)

        db.commit()
        print("Demo data seeded successfully!")
        print(f"  - Demo user: demo@defectloupe.com / demo1234")
        print(f"  - {len(clients)} clients")
        print(f"  - {len(properties)} properties")
        print(f"  - {len(inspections)} inspections")
        print(f"  - Areas for 2 inspections")
        print(f"  - {len(templates)} area templates")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
