from app.auth.security import create_access_token
from app.models.media_asset import MediaAsset
from app.models.project import Project, ProjectCategory, ProjectImage, Technology
from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def auth_headers(admin_user: User) -> dict[str, str]:
    token = create_access_token(str(admin_user.id), {"role": admin_user.role})
    return {"Authorization": f"Bearer {token}"}


def seed_project_data(db_session: Session) -> tuple[ProjectCategory, Technology]:
    category = ProjectCategory(name="React Projects", slug="react-projects", sort_order=1)
    technology = Technology(name="React", slug="react", category="frontend", sort_order=1)
    db_session.add_all([category, technology])
    db_session.commit()
    db_session.refresh(category)
    db_session.refresh(technology)
    return category, technology


def test_admin_can_create_project(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    category, technology = seed_project_data(db_session)

    response = client.post(
        "/api/v1/projects",
        json={
            "title": "Portfolio Workspace",
            "slug": "portfolio-workspace",
            "summary": "A developer workspace portfolio.",
            "categoryId": str(category.id),
            "technologyIds": [str(technology.id)],
            "status": "published",
            "featured": True,
        },
        headers=auth_headers(admin_user),
    )

    assert response.status_code == 201
    payload = response.json()["data"]
    assert payload["slug"] == "portfolio-workspace"
    assert payload["category"]["slug"] == "react-projects"
    assert payload["technologies"][0]["slug"] == "react"


def test_public_list_only_returns_published_projects(
    client: TestClient,
    db_session: Session,
) -> None:
    db_session.add_all(
        [
            Project(
                title="Published Project",
                slug="published-project",
                summary="Visible",
                status="published",
                sort_order=1,
            ),
            Project(
                title="Draft Project",
                slug="draft-project",
                summary="Hidden",
                status="draft",
                sort_order=2,
            ),
        ]
    )
    db_session.commit()

    response = client.get("/api/v1/projects")

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["meta"]["totalItems"] == 1
    assert payload["items"][0]["slug"] == "published-project"


def test_list_projects_supports_search_filter_sort_and_pagination(
    client: TestClient,
    db_session: Session,
) -> None:
    category, technology = seed_project_data(db_session)
    alpha = Project(
        title="Alpha React App",
        slug="alpha-react-app",
        summary="React dashboard",
        category_id=category.id,
        status="published",
        featured=True,
        sort_order=2,
    )
    beta = Project(
        title="Beta Data Lab",
        slug="beta-data-lab",
        summary="Data science notebook",
        status="published",
        featured=False,
        sort_order=1,
    )
    alpha.technologies = [technology]
    db_session.add_all([alpha, beta])
    db_session.commit()

    response = client.get(
        "/api/v1/projects",
        params={
            "search": "React",
            "categoryId": str(category.id),
            "technologyId": str(technology.id),
            "featured": "true",
            "sort": "title",
            "order": "desc",
            "page": 1,
            "pageSize": 10,
        },
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["meta"]["totalItems"] == 1
    assert payload["items"][0]["slug"] == "alpha-react-app"


def test_featured_projects_endpoint(client: TestClient, db_session: Session) -> None:
    db_session.add_all(
        [
            Project(
                title="Featured Project",
                slug="featured-project",
                summary="Visible",
                status="published",
                featured=True,
            ),
            Project(
                title="Unfeatured Project",
                slug="unfeatured-project",
                summary="Visible",
                status="published",
                featured=False,
            ),
        ]
    )
    db_session.commit()

    response = client.get("/api/v1/projects/featured")

    assert response.status_code == 200
    items = response.json()["data"]
    assert len(items) == 1
    assert items[0]["slug"] == "featured-project"


def test_project_details_only_returns_published_projects(
    client: TestClient,
    db_session: Session,
) -> None:
    db_session.add(
        Project(
            title="Published Project",
            slug="published-project",
            summary="Visible",
            status="published",
        )
    )
    db_session.commit()

    response = client.get("/api/v1/projects/published-project")

    assert response.status_code == 200
    assert response.json()["data"]["slug"] == "published-project"


def test_admin_can_update_and_delete_project(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    project = Project(
        title="Original Project",
        slug="original-project",
        summary="Original",
        status="draft",
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    update_response = client.patch(
        f"/api/v1/projects/{project.id}",
        json={"title": "Updated Project", "status": "published"},
        headers=auth_headers(admin_user),
    )

    assert update_response.status_code == 200
    assert update_response.json()["data"]["title"] == "Updated Project"

    delete_response = client.delete(
        f"/api/v1/projects/{project.id}",
        headers=auth_headers(admin_user),
    )

    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["deleted"] is True


def test_project_writes_require_admin(client: TestClient) -> None:
    response = client.post(
        "/api/v1/projects",
        json={
            "title": "Blocked",
            "slug": "blocked",
            "summary": "No token",
        },
    )

    assert response.status_code == 401


def test_admin_can_upload_project_image(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    project = Project(
        title="Image Project",
        slug="image-project",
        summary="Project with image",
        status="draft",
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    response = client.post(
        f"/api/v1/projects/{project.id}/images",
        data={"caption": "Preview", "sortOrder": "2"},
        files={"file": ("preview.png", b"fake-image", "image/png")},
        headers=auth_headers(admin_user),
    )

    assert response.status_code == 201
    payload = response.json()["data"]
    assert payload["caption"] == "Preview"
    assert payload["sortOrder"] == 2
    assert db_session.query(MediaAsset).count() == 1
    assert db_session.query(ProjectImage).count() == 1
