from datetime import UTC, datetime, timedelta

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
    assert "refreshToken" not in payload["data"]
    assert payload["data"]["expiresIn"] == 3600
    assert payload["data"]["user"]["email"] == "admin@sandesh.dev"
    set_cookie = response.headers["set-cookie"]
    assert "portfolio_refresh_token=" in set_cookie
    assert "HttpOnly" in set_cookie
    assert "SameSite=lax" in set_cookie
    assert "Path=/api/v1/auth" in set_cookie


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
    client.post(
        "/api/v1/auth/login",
        json={"email": "admin@sandesh.dev", "password": "secure-password"},
    )
    original_cookie = client.cookies.get("portfolio_refresh_token")

    response = client.post("/api/v1/auth/refresh")

    assert response.status_code == 200
    assert "refreshToken" not in response.json()["data"]
    assert client.cookies.get("portfolio_refresh_token") != original_cookie
    assert db_session.query(RefreshToken).count() == 2
    assert db_session.query(RefreshToken).filter(RefreshToken.revoked_at.is_not(None)).count() == 1
    active_token = db_session.query(RefreshToken).filter(RefreshToken.revoked_at.is_(None)).one()
    expected_expiry = (datetime.now(UTC) + timedelta(days=90)).replace(tzinfo=None)
    assert abs((active_token.expires_at - expected_expiry).total_seconds()) < 10


def test_logout_revokes_refresh_token(client: TestClient, admin_user: object) -> None:
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@sandesh.dev", "password": "secure-password"},
    )
    data = login_response.json()["data"]

    response = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {data['accessToken']}"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["loggedOut"] is True

    assert client.cookies.get("portfolio_refresh_token") is None

    refresh_response = client.post("/api/v1/auth/refresh")
    assert refresh_response.status_code == 401


def test_auth_cookie_endpoints_reject_unknown_browser_origin(
    client: TestClient,
    admin_user: object,
) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@sandesh.dev", "password": "secure-password"},
        headers={"Origin": "https://attacker.example"},
    )

    assert response.status_code == 403
    assert response.json()["errors"][0]["code"] == "origin_not_allowed"
