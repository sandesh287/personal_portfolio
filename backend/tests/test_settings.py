from app.auth.security import create_access_token
from app.models.setting import Setting
from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session


def auth_headers(user: User) -> dict[str, str]:
    token = create_access_token(str(user.id), {"role": user.role})
    return {"Authorization": f"Bearer {token}"}


def test_public_settings_return_defaults_without_database_rows(
    client: TestClient, db_session: Session
) -> None:
    response = client.get("/api/v1/settings/public")

    assert response.status_code == 200
    assert response.json()["data"]["siteTitle"] == "Sandesh Developer Workspace"
    assert response.json()["data"]["profileName"] == "Sandesh Panthee"
    assert db_session.scalar(select(Setting.id)) is None


def test_admin_can_update_settings_and_public_endpoint_reflects_changes(
    client: TestClient, db_session: Session, admin_user: User
) -> None:
    response = client.patch(
        "/api/v1/settings",
        headers=auth_headers(admin_user),
        json={
            "siteTitle": "Sandesh Engineering Workspace",
            "contactEmail": "hello@sandesh.dev",
            "githubUrl": "https://github.com/sandesh",
            "analyticsEnabled": True,
            "githubActivityVisible": False,
            "homeNotesVisible": False,
            "profileImageUrl": "https://cdn.example.com/profile.jpg",
            "profileBiography": "A sufficiently detailed public developer biography.",
        },
    )
    public = client.get("/api/v1/settings/public")

    assert response.status_code == 200
    assert response.json()["data"]["analyticsEnabled"] is True
    assert response.json()["data"]["githubActivityVisible"] is False
    assert response.json()["data"]["homeNotesVisible"] is False
    assert public.json()["data"]["profileImageUrl"] == "https://cdn.example.com/profile.jpg"
    assert public.json()["data"]["contactEmail"] == "hello@sandesh.dev"
    assert db_session.scalar(select(Setting).where(Setting.key == "site_title")) is not None


def test_settings_partial_update_preserves_existing_values(
    client: TestClient, admin_user: User
) -> None:
    headers = auth_headers(admin_user)
    client.patch(
        "/api/v1/settings",
        headers=headers,
        json={"siteTitle": "Custom Workspace", "profileRole": "React Developer"},
    )
    updated = client.patch(
        "/api/v1/settings", headers=headers, json={"profileRole": "Flutter Developer"}
    )

    assert updated.json()["data"]["siteTitle"] == "Custom Workspace"
    assert updated.json()["data"]["profileRole"] == "Flutter Developer"


def test_settings_reject_invalid_and_unknown_values(client: TestClient, admin_user: User) -> None:
    headers = auth_headers(admin_user)
    invalid_email = client.patch(
        "/api/v1/settings", headers=headers, json={"contactEmail": "invalid"}
    )
    invalid_url = client.patch(
        "/api/v1/settings", headers=headers, json={"linkedinUrl": "not-a-url"}
    )
    unknown = client.patch("/api/v1/settings", headers=headers, json={"githubToken": "secret"})

    assert invalid_email.status_code == 422
    assert invalid_url.status_code == 422
    assert unknown.status_code == 422


def test_admin_settings_require_authentication(client: TestClient) -> None:
    assert client.get("/api/v1/settings").status_code == 401
    assert client.patch("/api/v1/settings", json={"siteTitle": "No"}).status_code == 401
