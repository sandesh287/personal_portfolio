from uuid import UUID

from app.auth.security import create_access_token
from app.models.media_asset import MediaAsset
from app.models.resume import ResumeVersion
from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def auth_headers(user: User) -> dict[str, str]:
    token = create_access_token(str(user.id), {"role": user.role})
    return {"Authorization": f"Bearer {token}"}


def upload_resume(
    client: TestClient,
    user: User,
    *,
    title: str = "Sandesh Resume",
    version: str = "2026.1",
    is_active: bool = False,
):
    return client.post(
        "/api/v1/resume/versions",
        headers=auth_headers(user),
        data={"title": title, "version": version, "isActive": str(is_active).lower()},
        files={"file": ("sandesh-resume.pdf", b"%PDF-1.7\nresume", "application/pdf")},
    )


def test_first_resume_becomes_active_and_is_public(client: TestClient, admin_user: User) -> None:
    created = upload_resume(client, admin_user)

    assert created.status_code == 201
    assert created.json()["data"]["isActive"] is True
    public = client.get("/api/v1/resume")
    assert public.status_code == 200
    assert public.json()["data"]["version"] == "2026.1"


def test_resume_activation_history_and_active_delete_guard(
    client: TestClient, admin_user: User
) -> None:
    first = upload_resume(client, admin_user, version="1")
    second = upload_resume(client, admin_user, version="2")
    first_id = first.json()["data"]["id"]
    second_id = second.json()["data"]["id"]

    activated = client.post(
        f"/api/v1/resume/versions/{second_id}/activate", headers=auth_headers(admin_user)
    )
    versions = client.get("/api/v1/resume/versions", headers=auth_headers(admin_user))
    rejected = client.delete(
        f"/api/v1/resume/versions/{second_id}", headers=auth_headers(admin_user)
    )
    deleted = client.delete(f"/api/v1/resume/versions/{first_id}", headers=auth_headers(admin_user))

    assert activated.status_code == 200
    assert activated.json()["data"]["isActive"] is True
    assert [item["version"] for item in versions.json()["data"]] == ["2", "1"]
    assert rejected.status_code == 409
    assert rejected.json()["errors"][0]["code"] == "active_resume_delete"
    assert deleted.status_code == 200


def test_resume_upload_requires_admin_and_pdf(client: TestClient, admin_user: User) -> None:
    unauthenticated = client.post(
        "/api/v1/resume/versions",
        data={"title": "Resume", "version": "1"},
        files={"file": ("resume.pdf", b"%PDF", "application/pdf")},
    )
    invalid = client.post(
        "/api/v1/resume/versions",
        headers=auth_headers(admin_user),
        data={"title": "Resume", "version": "1"},
        files={"file": ("resume.txt", b"resume", "text/plain")},
    )

    assert unauthenticated.status_code == 401
    assert invalid.status_code == 422
    assert invalid.json()["errors"][0]["code"] == "invalid_resume_file_type"


def test_download_increments_count_and_media_cannot_be_deleted(
    client: TestClient, db_session: Session, admin_user: User
) -> None:
    created = upload_resume(client, admin_user)
    media_id = created.json()["data"]["mediaAssetId"]
    version_id = created.json()["data"]["id"]

    download = client.get("/api/v1/resume/download", follow_redirects=False)
    media_delete = client.delete(f"/api/v1/media/{media_id}", headers=auth_headers(admin_user))

    assert download.status_code == 307
    assert db_session.get(ResumeVersion, UUID(version_id)).download_count == 1
    assert media_delete.status_code == 409
    assert db_session.get(MediaAsset, UUID(media_id)).deleted_at is None


def test_missing_active_resume_returns_not_found(client: TestClient) -> None:
    response = client.get("/api/v1/resume")
    assert response.status_code == 404
    assert response.json()["errors"][0]["code"] == "resume_not_found"
