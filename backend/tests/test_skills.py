from uuid import UUID

from app.auth.security import create_access_token
from app.models.project import Technology
from app.models.skill import Skill
from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def auth_headers(admin_user: User) -> dict[str, str]:
    token = create_access_token(str(admin_user.id), {"role": admin_user.role})
    return {"Authorization": f"Bearer {token}"}


def seed_skills(db: Session) -> None:
    db.add_all(
        [
            Skill(name="React", slug="react", category="Frontend", level=5, sort_order=1),
            Skill(name="Flutter", slug="flutter", category="Mobile", level=4, sort_order=1),
            Skill(name="Python", slug="python", category="Data Science", level=4, sort_order=2),
        ]
    )
    db.commit()


def test_public_skill_list_supports_filtering_sorting_and_pagination(
    client: TestClient, db_session: Session
) -> None:
    seed_skills(db_session)

    response = client.get(
        "/api/v1/skills",
        params={"category": "Frontend", "level": 5, "sort": "name", "pageSize": 1},
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["meta"]["totalItems"] == 1
    assert payload["items"][0]["slug"] == "react"


def test_grouped_skills_are_ordered_by_category(client: TestClient, db_session: Session) -> None:
    seed_skills(db_session)

    response = client.get("/api/v1/skills/grouped")

    assert response.status_code == 200
    assert list(response.json()["data"]) == ["Data Science", "Frontend", "Mobile"]


def test_admin_skill_crud_with_optional_technology(
    client: TestClient, db_session: Session, admin_user: User
) -> None:
    technology = Technology(name="React", slug="react-tech", category="frontend", sort_order=1)
    db_session.add(technology)
    db_session.commit()
    db_session.refresh(technology)
    headers = auth_headers(admin_user)

    created = client.post(
        "/api/v1/skills",
        headers=headers,
        json={
            "technologyId": str(technology.id),
            "name": "React Architecture",
            "slug": "react-architecture",
            "category": "Frontend",
            "level": 5,
            "description": "Production React architecture.",
        },
    )

    assert created.status_code == 201
    skill_id = created.json()["data"]["id"]
    assert created.json()["data"]["technologyId"] == str(technology.id)
    updated = client.patch(f"/api/v1/skills/{skill_id}", headers=headers, json={"level": 4})
    assert updated.status_code == 200
    assert updated.json()["data"]["level"] == 4
    deleted = client.delete(f"/api/v1/skills/{skill_id}", headers=headers)
    assert deleted.status_code == 200
    assert db_session.get(Skill, UUID(skill_id)).deleted_at is not None


def test_skill_validation_and_slug_conflicts(
    client: TestClient, db_session: Session, admin_user: User
) -> None:
    seed_skills(db_session)
    headers = auth_headers(admin_user)
    invalid_level = client.post(
        "/api/v1/skills",
        headers=headers,
        json={"name": "Invalid", "slug": "invalid", "category": "Other", "level": 6},
    )
    duplicate = client.post(
        "/api/v1/skills",
        headers=headers,
        json={"name": "React 2", "slug": "react", "category": "Frontend", "level": 3},
    )

    assert invalid_level.status_code == 422
    assert duplicate.status_code == 409
    assert duplicate.json()["errors"][0]["code"] == "duplicate_skill_slug"


def test_skill_mutations_require_admin(client: TestClient) -> None:
    response = client.post(
        "/api/v1/skills",
        json={"name": "React", "slug": "react", "category": "Frontend", "level": 5},
    )
    assert response.status_code == 401
