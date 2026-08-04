from app.models.refresh_token import RefreshToken
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def test_login_returns_token_pair(client: TestClient, admin_user: object) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@sandesh.dev", "password": "secure-password"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["tokenType"] == "bearer"
    assert payload["data"]["accessToken"]
    assert payload["data"]["refreshToken"]
    assert payload["data"]["user"]["email"] == "admin@sandesh.dev"


def test_login_rejects_invalid_credentials(client: TestClient, admin_user: object) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@sandesh.dev", "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["errors"][0]["code"] == "invalid_credentials"


def test_current_user_requires_valid_access_token(client: TestClient, admin_user: object) -> None:
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@sandesh.dev", "password": "secure-password"},
    )
    access_token = login_response.json()["data"]["accessToken"]

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})

    assert response.status_code == 200
    assert response.json()["data"]["email"] == "admin@sandesh.dev"


def test_refresh_rotates_refresh_token(
    client: TestClient,
    db_session: Session,
    admin_user: object,
) -> None:
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@sandesh.dev", "password": "secure-password"},
    )
    refresh_token = login_response.json()["data"]["refreshToken"]

    response = client.post("/api/v1/auth/refresh", json={"refreshToken": refresh_token})

    assert response.status_code == 200
    assert response.json()["data"]["refreshToken"] != refresh_token
    assert db_session.query(RefreshToken).count() == 2
    assert db_session.query(RefreshToken).filter(RefreshToken.revoked_at.is_not(None)).count() == 1


def test_logout_revokes_refresh_token(client: TestClient, admin_user: object) -> None:
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@sandesh.dev", "password": "secure-password"},
    )
    data = login_response.json()["data"]

    response = client.post(
        "/api/v1/auth/logout",
        json={"refreshToken": data["refreshToken"]},
        headers={"Authorization": f"Bearer {data['accessToken']}"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["loggedOut"] is True

    refresh_response = client.post(
        "/api/v1/auth/refresh",
        json={"refreshToken": data["refreshToken"]},
    )
    assert refresh_response.status_code == 401
