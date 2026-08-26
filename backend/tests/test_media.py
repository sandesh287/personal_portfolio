from pathlib import Path
from uuid import UUID

from app.auth.security import create_access_token
from app.models.media_asset import MediaAsset
from app.models.project import Project
from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def auth_headers(admin_user: User) -> dict[str, str]:
    token = create_access_token(str(admin_user.id), {"role": admin_user.role})
    return {"Authorization": f"Bearer {token}"}


def upload_image(client: TestClient, admin_user: User, filename: str = "preview.png"):
    return client.post(
        "/api/v1/media",
        data={"altText": "Portfolio preview", "folder": "projects"},
        files={"file": (filename, b"image-content", "image/png")},
        headers=auth_headers(admin_user),
    )


def test_media_routes_require_admin(client: TestClient) -> None:
    assert client.get("/api/v1/media").status_code == 401


def test_admin_can_upload_and_get_media(client: TestClient, admin_user: User) -> None:
    response = upload_image(client, admin_user)

    assert response.status_code == 201
    payload = response.json()["data"]
    assert payload["originalFilename"] == "preview.png"
    assert payload["contentType"] == "image/png"
    assert payload["altText"] == "Portfolio preview"
    assert payload["folder"] == "projects"
    assert payload["imageWidth"] is None
    assert payload["imageHeight"] is None
    assert payload["placeholderUrl"] is None
    assert "storagePath" not in payload

    detail = client.get(
        f"/api/v1/media/{payload['id']}",
        headers=auth_headers(admin_user),
    )
    assert detail.status_code == 200
    assert detail.json()["data"]["id"] == payload["id"]


def test_admin_can_search_filter_and_update_media(
    client: TestClient,
    admin_user: User,
) -> None:
    media_id = upload_image(client, admin_user, "workspace-preview.png").json()["data"]["id"]
    headers = auth_headers(admin_user)

    listed = client.get(
        "/api/v1/media",
        params={"search": "workspace", "contentType": "image", "folder": "projects"},
        headers=headers,
    )
    assert listed.status_code == 200
    assert listed.json()["data"]["meta"]["totalItems"] == 1

    updated = client.patch(
        f"/api/v1/media/{media_id}",
        json={"altText": "Updated preview", "folder": "homepage"},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["data"]["altText"] == "Updated preview"
    assert updated.json()["data"]["folder"] == "homepage"


def test_upload_rejects_unsupported_media(client: TestClient, admin_user: User) -> None:
    response = client.post(
        "/api/v1/media",
        files={"file": ("payload.exe", b"content", "application/octet-stream")},
        headers=auth_headers(admin_user),
    )

    assert response.status_code == 422
    assert response.json()["errors"][0]["code"] == "unsupported_media_type"


def test_admin_can_delete_unreferenced_media(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    media_id = upload_image(client, admin_user).json()["data"]["id"]
    media = db_session.get(MediaAsset, UUID(media_id))
    assert media is not None
    stored_path = Path(media.storage_path)
    assert stored_path.exists()

    response = client.delete(f"/api/v1/media/{media_id}", headers=auth_headers(admin_user))

    assert response.status_code == 200
    assert response.json()["data"] == {"deleted": True}
    assert not stored_path.exists()
    assert (
        client.get(f"/api/v1/media/{media_id}", headers=auth_headers(admin_user)).status_code == 404
    )


def test_referenced_media_cannot_be_deleted(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    media_id = upload_image(client, admin_user).json()["data"]["id"]
    project = Project(
        title="Referenced Media",
        slug="referenced-media",
        summary="Project using a library asset",
        cover_image_id=UUID(media_id),
    )
    db_session.add(project)
    db_session.commit()

    response = client.delete(f"/api/v1/media/{media_id}", headers=auth_headers(admin_user))

    assert response.status_code == 409
    assert response.json()["errors"][0]["code"] == "media_asset_in_use"
