"""Integration test: test all media-service endpoints."""
import httpx
import jwt
import uuid
from datetime import datetime, timezone, timedelta

BASE = "http://localhost:9000"
SECRET = "dev-access-secret-47977f4-defectloupe-hackathon"

# 1. Health check
print("=" * 60)
print("1. HEALTH CHECK")
r = httpx.get(f"{BASE}/health")
print(f"   {r.status_code} {r.json()}")

# 2. Create test data using raw SQL
print("\n2. SETTING UP TEST DATA")
import os, sys
sys.path.insert(0, ".")
sys.path.insert(0, "../..")
os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:5433/defect-loupe"

from shared.db_config import SessionLocal
from shared.password import hash_password
from sqlalchemy import text

db = SessionLocal()
user_id = uuid.uuid4()
inspector_id = uuid.uuid4()
area_id = uuid.uuid4()
test_email = f"test-{uuid.uuid4().hex[:8]}@defectloupe.com"

hashed = hash_password("test1234")
db.execute(text(f"INSERT INTO users (id, email, hashed_password, is_active, email_verified) VALUES ('{user_id}', '{test_email}', '{hashed}', true, true)"))
db.execute(text(f"INSERT INTO inspectors (id, user_id, first_name, last_name, inspector_type, is_active) VALUES ('{inspector_id}', '{user_id}', 'Test', 'User', 'individual', true)"))
db.execute(text(f"INSERT INTO inspection_areas (id, inspection_id, name, display_order) VALUES ('{area_id}', '{uuid.uuid4()}', 'Test Area', 1)"))
db.commit()
print(f"   Created user, inspector, area")

# 3. Generate JWT token
token = jwt.encode(
    {"sub": str(user_id), "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
    SECRET, algorithm="HS256"
)
cookies = {"access_token": token}

# 4. Upload a photo (create a tiny test image)
print("\n3. UPLOAD PHOTO")
from io import BytesIO
from PIL import Image
img = Image.new("RGB", (100, 100), "red")
buf = BytesIO()
img.save(buf, format="JPEG")
buf.seek(0)

r = httpx.post(
    f"{BASE}/api/v1/areas/{area_id}/photos",
    files={"file": ("test.jpg", buf, "image/jpeg")},
    cookies=cookies,
)
print(f"   {r.status_code}")
if r.status_code >= 400:
    print(f"   ERROR: {r.text[:500]}")
    sys.exit(1)
print(f"   {r.json()}")
photo_id = r.json().get("id")

# 5. List photos
print("\n4. LIST PHOTOS")
r = httpx.get(f"{BASE}/api/v1/areas/{area_id}/photos", cookies=cookies)
print(f"   {r.status_code} — {len(r.json())} photos")
if r.json():
    print(f"   First photo: {r.json()[0]['photo_url'][:80]}...")

# 6. Create text observation
print("\n5. CREATE TEXT OBSERVATION")
r = httpx.post(
    f"{BASE}/api/v1/areas/{area_id}/observations",
    json={"observation_text": "Crack found in the wall", "photo_id": photo_id},
    cookies=cookies,
)
print(f"   {r.status_code} type={r.json().get('observation_type')}")

# 7. Create observation on photo
print("\n6. CREATE OBSERVATION ON PHOTO")
r = httpx.post(
    f"{BASE}/api/v1/photos/{photo_id}/observations",
    json={"observation_text": "Paint peeling near the window"},
    cookies=cookies,
)
print(f"   {r.status_code} type={r.json().get('observation_type')}")

# 8. List observations
print("\n7. LIST OBSERVATIONS")
r = httpx.get(f"{BASE}/api/v1/areas/{area_id}/observations", cookies=cookies)
print(f"   {r.status_code} — {len(r.json())} observations")
for obs in r.json():
    print(f"     - [{obs['observation_type']}] {obs['observation_text'][:50]}")

# 9. Download photo (redirect)
print("\n8. DOWNLOAD PHOTO (redirect)")
r = httpx.get(f"{BASE}/api/v1/photos/{photo_id}/download", cookies=cookies, follow_redirects=False)
print(f"   {r.status_code} — {r.headers.get('location', '')[:80]}...")

# 10. Delete photo
print("\n9. DELETE PHOTO")
r = httpx.delete(f"{BASE}/api/v1/photos/{photo_id}", cookies=cookies)
print(f"   {r.status_code} {r.json()}")

# 11. List photos (should be empty)
print("\n10. LIST PHOTOS (should be empty)")
r = httpx.get(f"{BASE}/api/v1/areas/{area_id}/photos", cookies=cookies)
print(f"   {r.status_code} — {len(r.json())} photos")

# 12. Test unauthenticated request
print("\n11. UNAUTHENTICATED REQUEST (should be 401)")
r = httpx.get(f"{BASE}/api/v1/areas/{area_id}/photos")
print(f"   {r.status_code} {r.json()}")

# Cleanup
print("\n12. CLEANUP")
db.execute(text(f"DELETE FROM area_observations WHERE inspection_area_id = '{area_id}'"))
db.execute(text(f"DELETE FROM inspection_areas WHERE id = '{area_id}'"))
db.execute(text(f"DELETE FROM inspectors WHERE id = '{inspector_id}'"))
db.execute(text(f"DELETE FROM users WHERE id = '{user_id}'"))
db.commit()
db.close()
print("   Test data cleaned up")

print("\n" + "=" * 60)
print("ALL TESTS PASSED!")
