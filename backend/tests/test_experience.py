from datetime import date
from uuid import UUID

from app.auth.security import create_access_token
from app.models.experience import Certification, Education, Experience
from app.models.media_asset import MediaAsset
from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def auth_headers(admin_user: User) -> dict[str, str]:
    token = create_access_token(str(admin_user.id), {"role": admin_user.role})
    return {"Authorization": f"Bearer {token}"}


def test_public_timeline_only_returns_published_entries(
    client: TestClient, db_session: Session
) -> None:
    db_session.add_all(
        [
            Experience(
                company="Published Co",
                role="Frontend Developer",
                start_date=date(2025, 1, 1),
                current=True,
                summary="Published role",
                published=True,
            ),
            Experience(
                company="Draft Co",
                role="Developer",
                start_date=date(2024, 1, 1),
                summary="Draft role",
                published=False,
            ),
            Education(
                institution="Published University",
                degree="BSc Data Science",
                start_date=date(2023, 1, 1),
                current=True,
                published=True,
            ),
            Education(
                institution="Draft University",
                degree="Draft Degree",
                start_date=date(2020, 1, 1),
                published=False,
            ),
        ]
    )
    db_session.commit()

    experiences = client.get("/api/v1/experience")
    education = client.get("/api/v1/experience/education")

    assert experiences.status_code == 200
    assert [item["company"] for item in experiences.json()["data"]] == ["Published Co"]
    assert education.status_code == 200
    assert [item["institution"] for item in education.json()["data"]] == ["Published University"]


def test_admin_experience_crud_and_validation(
    client: TestClient, db_session: Session, admin_user: User
) -> None:
    headers = auth_headers(admin_user)
    created = client.post(
        "/api/v1/experience/admin",
        headers=headers,
        json={
            "company": "Acme",
            "role": "React Developer",
            "employmentType": "Full-time",
            "startDate": "2024-01-01",
            "current": True,
            "summary": "Built accessible frontend systems.",
            "achievements": ["Improved performance", "Improved performance", "  "],
            "technologies": ["React", "TypeScript"],
            "published": True,
        },
    )

    assert created.status_code == 201
    entry_id = created.json()["data"]["id"]
    assert created.json()["data"]["achievements"] == ["Improved performance"]
    assert client.get("/api/v1/experience/admin", headers=headers).json()["data"]

    invalid = client.patch(
        f"/api/v1/experience/admin/{entry_id}",
        headers=headers,
        json={"endDate": "2023-01-01", "current": False},
    )
    assert invalid.status_code == 422
    assert invalid.json()["errors"][0]["code"] == "invalid_dates"

    updated = client.patch(
        f"/api/v1/experience/admin/{entry_id}",
        headers=headers,
        json={"role": "Senior React Developer"},
    )
    assert updated.status_code == 200
    assert updated.json()["data"]["role"] == "Senior React Developer"

    deleted = client.delete(f"/api/v1/experience/admin/{entry_id}", headers=headers)
    assert deleted.status_code == 200
    assert db_session.get(Experience, UUID(entry_id)).deleted_at is not None


def test_admin_education_crud(client: TestClient, db_session: Session, admin_user: User) -> None:
    headers = auth_headers(admin_user)
    created = client.post(
        "/api/v1/experience/admin/education",
        headers=headers,
        json={
            "institution": "Example University",
            "degree": "BSc",
            "fieldOfStudy": "Data Science",
            "startDate": "2023-01-01",
            "current": True,
            "achievements": ["Dean's list"],
            "published": True,
        },
    )

    assert created.status_code == 201
    entry_id = created.json()["data"]["id"]
    assert client.get("/api/v1/experience/admin/education", headers=headers).status_code == 200
    assert (
        client.patch(
            f"/api/v1/experience/admin/education/{entry_id}",
            headers=headers,
            json={"degree": "Bachelor of Science"},
        ).json()["data"]["degree"]
        == "Bachelor of Science"
    )
    assert (
        client.delete(f"/api/v1/experience/admin/education/{entry_id}", headers=headers).status_code
        == 200
    )
    assert db_session.get(Education, UUID(entry_id)).deleted_at is not None


def test_timeline_admin_endpoints_require_authentication(client: TestClient) -> None:
    assert client.get("/api/v1/experience/admin").status_code == 401
    assert client.get("/api/v1/experience/admin/education").status_code == 401
    assert client.get("/api/v1/experience/admin/certifications").status_code == 401


def test_admin_certification_crud_and_public_filtering(
    client: TestClient, db_session: Session, admin_user: User
) -> None:
    media = MediaAsset(
        filename="credential.png",
        original_filename="credential.png",
        storage_path="credentials/credential.png",
        public_url="https://cdn.example.com/credential.png",
        content_type="image/png",
        size_bytes=1024,
    )
    db_session.add(media)
    db_session.commit()
    headers = auth_headers(admin_user)
    created = client.post(
        "/api/v1/experience/admin/certifications",
        headers=headers,
        json={
            "name": "React Advanced",
            "issuer": "Frontend Institute",
            "credentialMediaId": str(media.id),
            "issuedAt": "2025-01-01",
            "published": False,
        },
    )

    assert created.status_code == 201
    entry_id = created.json()["data"]["id"]
    assert created.json()["data"]["credentialMediaUrl"] == media.public_url
    assert client.get("/api/v1/experience/certifications").json()["data"] == []

    updated = client.patch(
        f"/api/v1/experience/admin/certifications/{entry_id}",
        headers=headers,
        json={"published": True, "credentialId": "CERT-123"},
    )
    public = client.get("/api/v1/experience/certifications")

    assert updated.status_code == 200
    assert public.json()["data"][0]["credentialId"] == "CERT-123"
    assert (
        client.delete(
            f"/api/v1/experience/admin/certifications/{entry_id}", headers=headers
        ).status_code
        == 200
    )
    assert db_session.get(Certification, UUID(entry_id)).deleted_at is not None


def test_certification_rejects_invalid_media_and_dates(
    client: TestClient, admin_user: User
) -> None:
    headers = auth_headers(admin_user)
    invalid_media = client.post(
        "/api/v1/experience/admin/certifications",
        headers=headers,
        json={
            "name": "Invalid media",
            "issuer": "Issuer",
            "credentialMediaId": "12345678-1234-1234-1234-123456789012",
        },
    )
    invalid_dates = client.post(
        "/api/v1/experience/admin/certifications",
        headers=headers,
        json={
            "name": "Invalid dates",
            "issuer": "Issuer",
            "issuedAt": "2025-05-01",
            "expiresAt": "2025-01-01",
        },
    )

    assert invalid_media.status_code == 422
    assert invalid_media.json()["errors"][0]["code"] == "invalid_credential_media"
    assert invalid_dates.status_code == 422
