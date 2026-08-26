from app.auth.security import create_access_token
from app.models.analytics_event import AnalyticsEvent
from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session


def auth_headers(user: User) -> dict[str, str]:
    token = create_access_token(str(user.id), {"role": user.role})
    return {"Authorization": f"Bearer {token}"}


def test_tracking_is_disabled_by_default(client: TestClient, db_session: Session) -> None:
    response = client.post(
        "/api/v1/analytics/events",
        json={"eventName": "page_viewed", "path": "/projects"},
    )

    assert response.status_code == 201
    assert response.json()["data"]["tracked"] is False
    assert db_session.scalar(select(func.count(AnalyticsEvent.id))) == 0


def test_enabled_analytics_tracks_and_aggregates_events(
    client: TestClient, db_session: Session, admin_user: User
) -> None:
    headers = auth_headers(admin_user)
    client.patch("/api/v1/settings", headers=headers, json={"analyticsEnabled": True})
    for path in ("/projects/alpha", "/projects/alpha", "/blog/first-note"):
        tracked = client.post(
            "/api/v1/analytics/events",
            json={
                "eventName": "page_viewed",
                "path": path,
                "visitorId": "1234567890abcdef",
            },
        )
        assert tracked.json()["data"]["tracked"] is True

    summary = client.get("/api/v1/analytics/summary", headers=headers)
    series = client.get("/api/v1/analytics/timeseries", headers=headers)

    assert summary.status_code == 200
    metrics = {item["key"]: item["value"] for item in summary.json()["data"]["metrics"]}
    assert metrics["visitors"] == 1
    assert metrics["pageViews"] == 3
    assert summary.json()["data"]["popularContent"][0] == {
        "path": "/projects/alpha",
        "views": 2,
    }
    assert series.status_code == 200
    assert sum(point["value"] for point in series.json()["data"]["points"]) == 3
    assert db_session.scalar(select(func.count(AnalyticsEvent.id))) == 3


def test_analytics_dashboard_requires_admin(client: TestClient) -> None:
    assert client.get("/api/v1/analytics/summary").status_code == 401
    assert client.get("/api/v1/analytics/timeseries").status_code == 401


def test_analytics_validation_rejects_external_paths(client: TestClient) -> None:
    response = client.post(
        "/api/v1/analytics/events",
        json={"eventName": "page_viewed", "path": "https://example.com"},
    )

    assert response.status_code == 422
