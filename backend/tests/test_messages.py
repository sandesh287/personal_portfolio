from uuid import UUID

from app.auth.security import create_access_token
from app.models.message import Message
from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session


def auth_headers(user: User) -> dict[str, str]:
    token = create_access_token(str(user.id), {"role": user.role})
    return {"Authorization": f"Bearer {token}"}


def message_payload(index: int = 1) -> dict[str, str]:
    return {
        "name": "Portfolio Visitor",
        "email": "visitor@example.com",
        "subject": f"Project inquiry {index}",
        "message": f"I would like to discuss a React project with you. Reference {index}.",
        "source": "communication_terminal",
    }


def test_public_message_is_persisted_with_request_metadata(
    client: TestClient, db_session: Session
) -> None:
    response = client.post(
        "/api/v1/messages",
        json=message_payload(),
        headers={"x-forwarded-for": "203.0.113.8", "user-agent": "Portfolio Test"},
    )

    assert response.status_code == 201
    assert response.json()["data"]["received"] is True
    message = db_session.get(Message, UUID(response.json()["data"]["id"]))
    assert message is not None
    assert message.ip_address == "203.0.113.8"
    assert message.user_agent == "Portfolio Test"
    assert message.read is False


def test_honeypot_is_silently_accepted_without_persistence(
    client: TestClient, db_session: Session
) -> None:
    payload = {**message_payload(), "website": "https://spam.example"}
    response = client.post("/api/v1/messages", json=payload)

    assert response.status_code == 201
    assert response.json()["data"]["received"] is True
    assert db_session.scalar(select(func.count(Message.id))) == 0


def test_duplicate_and_link_heavy_messages_are_rejected(client: TestClient) -> None:
    first = client.post("/api/v1/messages", json=message_payload())
    duplicate = client.post("/api/v1/messages", json=message_payload())
    link_heavy = client.post(
        "/api/v1/messages",
        json={
            **message_payload(2),
            "message": "Please check https://a.dev https://b.dev https://c.dev https://d.dev",
        },
    )

    assert first.status_code == 201
    assert duplicate.status_code == 429
    assert duplicate.json()["errors"][0]["code"] == "duplicate_message"
    assert link_heavy.status_code == 422
    assert link_heavy.json()["errors"][0]["code"] == "message_link_limit"


def test_contact_submission_rate_limit_is_database_backed(client: TestClient) -> None:
    headers = {"x-forwarded-for": "203.0.113.25"}
    for index in range(5):
        response = client.post("/api/v1/messages", json=message_payload(index), headers=headers)
        assert response.status_code == 201

    rejected = client.post("/api/v1/messages", json=message_payload(6), headers=headers)
    assert rejected.status_code == 429
    assert rejected.json()["errors"][0]["code"] == "contact_rate_limited"


def test_admin_message_inbox_supports_filters_updates_and_deletion(
    client: TestClient, db_session: Session, admin_user: User
) -> None:
    for index in range(3):
        message = Message(
            name=f"Visitor {index}",
            email=f"visitor{index}@example.com",
            subject=f"Inquiry {index}",
            message=f"Detailed portfolio inquiry number {index}.",
            source="contact_form",
            read=index == 1,
            archived=index == 2,
            starred=index == 0,
            ip_address="127.0.0.1",
        )
        db_session.add(message)
    db_session.commit()
    headers = auth_headers(admin_user)

    unread = client.get(
        "/api/v1/messages",
        headers=headers,
        params={"read": False, "archived": False, "pageSize": 10},
    )
    message_id = unread.json()["data"]["items"][0]["id"]
    details = client.get(f"/api/v1/messages/{message_id}", headers=headers)
    updated = client.patch(
        f"/api/v1/messages/{message_id}",
        headers=headers,
        json={"read": True, "archived": True},
    )
    deleted = client.delete(f"/api/v1/messages/{message_id}", headers=headers)

    assert unread.status_code == 200
    assert unread.json()["data"]["meta"]["totalItems"] == 1
    assert details.status_code == 200
    assert updated.json()["data"]["read"] is True
    assert updated.json()["data"]["archived"] is True
    assert deleted.status_code == 200
    assert db_session.get(Message, UUID(message_id)).deleted_at is not None


def test_admin_message_routes_require_authentication(client: TestClient) -> None:
    assert client.get("/api/v1/messages").status_code == 401
    assert client.get("/api/v1/messages/00000000-0000-0000-0000-000000000000").status_code == 401


def test_message_validation_uses_standard_error_envelope(client: TestClient) -> None:
    response = client.post(
        "/api/v1/messages",
        json={"name": "A", "email": "invalid", "subject": "x", "message": "short"},
    )

    assert response.status_code == 422
    assert response.json()["success"] is False
    assert response.json()["errors"]
