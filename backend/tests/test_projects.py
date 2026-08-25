from datetime import UTC, datetime

from app.auth.security import create_access_token
from app.models.media_asset import MediaAsset
from app.models.project import Project, ProjectCategory, ProjectImage, ProjectVideo, Technology
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


def test_admin_list_returns_all_statuses(
    client: TestClient,
    db_session: Session,
    admin_user: User,
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
                summary="Editable",
                status="draft",
                sort_order=2,
            ),
        ]
    )
    db_session.commit()

    response = client.get(
        "/api/v1/projects/admin",
        params={"sort": "sortOrder", "order": "asc"},
        headers=auth_headers(admin_user),
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["meta"]["totalItems"] == 2
    assert [project["slug"] for project in payload["items"]] == [
        "published-project",
        "draft-project",
    ]


def test_admin_list_requires_admin(client: TestClient) -> None:
    response = client.get("/api/v1/projects/admin")

    assert response.status_code == 401


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


def test_project_categories_endpoint_returns_ordered_active_categories(
    client: TestClient,
    db_session: Session,
) -> None:
    db_session.add_all(
        [
            ProjectCategory(name="Data Science", slug="data-science", sort_order=2),
            ProjectCategory(name="React", slug="react", sort_order=1),
            ProjectCategory(
                name="Archived",
                slug="archived",
                sort_order=3,
                deleted_at=datetime(2026, 1, 1, tzinfo=UTC),
            ),
        ]
    )
    db_session.commit()

    response = client.get("/api/v1/projects/categories")

    assert response.status_code == 200
    payload = response.json()["data"]
    assert [category["slug"] for category in payload] == ["react", "data-science"]
    assert payload[0]["sortOrder"] == 1


def test_technologies_endpoint_supports_category_filter(
    client: TestClient,
    db_session: Session,
) -> None:
    db_session.add_all(
        [
            Technology(name="React", slug="react", category="frontend", sort_order=2),
            Technology(name="TypeScript", slug="typescript", category="frontend", sort_order=1),
            Technology(name="Python", slug="python", category="data-science", sort_order=3),
        ]
    )
    db_session.commit()

    response = client.get("/api/v1/projects/technologies", params={"category": "frontend"})

    assert response.status_code == 200
    payload = response.json()["data"]
    assert [technology["slug"] for technology in payload] == ["typescript", "react"]
    assert {technology["category"] for technology in payload} == {"frontend"}


def test_admin_can_manage_project_categories(
    client: TestClient,
    admin_user: User,
) -> None:
    headers = auth_headers(admin_user)

    create_response = client.post(
        "/api/v1/projects/categories",
        json={
            "name": "Backend",
            "slug": "backend",
            "description": "Backend projects",
            "sortOrder": 5,
        },
        headers=headers,
    )

    assert create_response.status_code == 201
    category_id = create_response.json()["data"]["id"]

    update_response = client.patch(
        f"/api/v1/projects/categories/{category_id}",
        json={"name": "Backend Systems", "sortOrder": 6},
        headers=headers,
    )

    assert update_response.status_code == 200
    assert update_response.json()["data"]["name"] == "Backend Systems"

    delete_response = client.delete(
        f"/api/v1/projects/categories/{category_id}",
        headers=headers,
    )

    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["deleted"] is True


def test_category_delete_is_blocked_when_in_use(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    category = ProjectCategory(name="React", slug="react", sort_order=1)
    project = Project(
        title="React Project",
        slug="react-project",
        summary="Uses category",
        status="draft",
        category=category,
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(category)

    response = client.delete(
        f"/api/v1/projects/categories/{category.id}",
        headers=auth_headers(admin_user),
    )

    assert response.status_code == 409
    assert response.json()["errors"][0]["code"] == "project_category_in_use"


def test_admin_can_manage_technologies(
    client: TestClient,
    admin_user: User,
) -> None:
    headers = auth_headers(admin_user)

    create_response = client.post(
        "/api/v1/projects/technologies",
        json={
            "name": "FastAPI",
            "slug": "fastapi",
            "category": "backend",
            "icon": "server",
            "color": "#009688",
            "sortOrder": 7,
        },
        headers=headers,
    )

    assert create_response.status_code == 201
    technology_id = create_response.json()["data"]["id"]

    update_response = client.patch(
        f"/api/v1/projects/technologies/{technology_id}",
        json={"name": "FastAPI Framework", "sortOrder": 8},
        headers=headers,
    )

    assert update_response.status_code == 200
    assert update_response.json()["data"]["name"] == "FastAPI Framework"

    delete_response = client.delete(
        f"/api/v1/projects/technologies/{technology_id}",
        headers=headers,
    )

    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["deleted"] is True


def test_technology_delete_is_blocked_when_in_use(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    technology = Technology(name="React", slug="react", category="frontend", sort_order=1)
    project = Project(
        title="React Project",
        slug="react-project",
        summary="Uses technology",
        status="draft",
    )
    project.technologies = [technology]
    db_session.add(project)
    db_session.commit()
    db_session.refresh(technology)

    response = client.delete(
        f"/api/v1/projects/technologies/{technology.id}",
        headers=auth_headers(admin_user),
    )

    assert response.status_code == 409
    assert response.json()["errors"][0]["code"] == "technology_in_use"


def test_category_and_technology_writes_require_admin(client: TestClient) -> None:
    category_response = client.post(
        "/api/v1/projects/categories",
        json={"name": "Blocked", "slug": "blocked"},
    )
    technology_response = client.post(
        "/api/v1/projects/technologies",
        json={"name": "Blocked", "slug": "blocked", "category": "frontend"},
    )

    assert category_response.status_code == 401
    assert technology_response.status_code == 401


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


def test_admin_can_manage_project_images_and_cover(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    project = Project(
        title="Media Project",
        slug="media-project",
        summary="Project with media",
        status="draft",
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)
    headers = auth_headers(admin_user)

    upload_response = client.post(
        f"/api/v1/projects/{project.id}/images",
        data={"caption": "Cover preview", "sortOrder": "1"},
        files={"file": ("cover.png", b"fake-image", "image/png")},
        headers=headers,
    )

    assert upload_response.status_code == 201
    image_id = upload_response.json()["data"]["id"]

    list_response = client.get(f"/api/v1/projects/{project.id}/images", headers=headers)

    assert list_response.status_code == 200
    assert list_response.json()["data"][0]["id"] == image_id
    assert list_response.json()["data"][0]["url"] is not None

    cover_response = client.patch(
        f"/api/v1/projects/{project.id}/cover-image",
        json={"imageId": image_id},
        headers=headers,
    )

    assert cover_response.status_code == 200
    assert (
        cover_response.json()["data"]["coverImageId"]
        == upload_response.json()["data"]["mediaAssetId"]
    )

    delete_response = client.delete(
        f"/api/v1/projects/{project.id}/images/{image_id}",
        headers=headers,
    )

    assert delete_response.status_code == 200
    db_session.refresh(project)
    assert project.cover_image_id is None


def test_project_image_management_requires_admin(
    client: TestClient,
    db_session: Session,
) -> None:
    project = Project(
        title="Protected Media Project",
        slug="protected-media-project",
        summary="Project with protected media",
        status="draft",
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    response = client.get(f"/api/v1/projects/{project.id}/images")

    assert response.status_code == 401


def test_admin_can_attach_library_image_to_project(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    project = Project(
        title="Library Project",
        slug="library-project",
        summary="Uses shared media",
        status="draft",
    )
    media = MediaAsset(
        filename="stored-preview.png",
        original_filename="preview.png",
        storage_path="uploads/stored-preview.png",
        public_url="http://testserver/uploads/stored-preview.png",
        content_type="image/png",
        size_bytes=128,
    )
    db_session.add_all([project, media])
    db_session.commit()
    headers = auth_headers(admin_user)

    response = client.post(
        f"/api/v1/projects/{project.id}/images/attach",
        json={"mediaAssetId": str(media.id), "caption": "Shared preview", "sortOrder": 3},
        headers=headers,
    )

    assert response.status_code == 201
    assert response.json()["data"]["mediaAssetId"] == str(media.id)
    assert response.json()["data"]["caption"] == "Shared preview"
    assert db_session.query(MediaAsset).count() == 1
    assert db_session.query(ProjectImage).count() == 1

    duplicate = client.post(
        f"/api/v1/projects/{project.id}/images/attach",
        json={"mediaAssetId": str(media.id)},
        headers=headers,
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["errors"][0]["code"] == "project_image_exists"


def test_project_gallery_rejects_non_image_library_asset(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    project = Project(
        title="PDF Project",
        slug="pdf-project",
        summary="Rejects PDF gallery assets",
        status="draft",
    )
    media = MediaAsset(
        filename="resume.pdf",
        original_filename="resume.pdf",
        storage_path="uploads/resume.pdf",
        public_url="http://testserver/uploads/resume.pdf",
        content_type="application/pdf",
        size_bytes=128,
    )
    db_session.add_all([project, media])
    db_session.commit()

    response = client.post(
        f"/api/v1/projects/{project.id}/images/attach",
        json={"mediaAssetId": str(media.id)},
        headers=auth_headers(admin_user),
    )

    assert response.status_code == 422
    assert response.json()["errors"][0]["code"] == "invalid_project_image"


def test_admin_can_attach_and_remove_library_video(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    project = Project(
        title="Video Project",
        slug="video-project",
        summary="Uses shared video",
        status="draft",
    )
    media = MediaAsset(
        filename="demo.mp4",
        original_filename="demo.mp4",
        storage_path="uploads/demo.mp4",
        public_url="http://testserver/uploads/demo.mp4",
        content_type="video/mp4",
        size_bytes=512,
    )
    db_session.add_all([project, media])
    db_session.commit()
    headers = auth_headers(admin_user)

    attached = client.post(
        f"/api/v1/projects/{project.id}/videos/attach",
        json={"mediaAssetId": str(media.id), "title": "Demo", "sortOrder": 2},
        headers=headers,
    )

    assert attached.status_code == 201
    video = attached.json()["data"]
    assert video["provider"] == "local"
    assert video["url"] == media.public_url
    assert db_session.query(MediaAsset).count() == 1

    duplicate = client.post(
        f"/api/v1/projects/{project.id}/videos/attach",
        json={"mediaAssetId": str(media.id)},
        headers=headers,
    )
    assert duplicate.status_code == 409

    listed = client.get(f"/api/v1/projects/{project.id}/videos", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["data"][0]["id"] == video["id"]

    removed = client.delete(
        f"/api/v1/projects/{project.id}/videos/{video['id']}",
        headers=headers,
    )
    assert removed.status_code == 200
    assert db_session.query(MediaAsset).count() == 1


def test_admin_can_add_youtube_and_vimeo_project_videos(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    project = Project(
        title="External Videos",
        slug="external-videos",
        summary="Uses hosted videos",
        status="draft",
    )
    db_session.add(project)
    db_session.commit()
    headers = auth_headers(admin_user)

    youtube = client.post(
        f"/api/v1/projects/{project.id}/videos/external",
        json={"externalUrl": "https://www.youtube.com/watch?v=abc123", "title": "Walkthrough"},
        headers=headers,
    )
    vimeo = client.post(
        f"/api/v1/projects/{project.id}/videos/external",
        json={"externalUrl": "https://vimeo.com/123456", "title": "Case study"},
        headers=headers,
    )

    assert youtube.status_code == 201
    assert youtube.json()["data"]["provider"] == "youtube"
    assert vimeo.status_code == 201
    assert vimeo.json()["data"]["provider"] == "vimeo"
    assert db_session.query(ProjectVideo).count() == 2

    video_id = youtube.json()["data"]["id"]
    updated = client.patch(
        f"/api/v1/projects/{project.id}/videos/{video_id}",
        json={"title": "Updated walkthrough", "caption": "New caption", "sortOrder": 4},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["data"]["title"] == "Updated walkthrough"
    assert updated.json()["data"]["sortOrder"] == 4

    duplicate = client.post(
        f"/api/v1/projects/{project.id}/videos/external",
        json={"externalUrl": "https://www.youtube.com/watch?v=abc123"},
        headers=headers,
    )
    assert duplicate.status_code == 409


def test_project_video_validation_and_authorization(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    project = Project(
        title="Protected Videos",
        slug="protected-videos",
        summary="Validates video inputs",
        status="draft",
    )
    image = MediaAsset(
        filename="preview.png",
        original_filename="preview.png",
        storage_path="uploads/preview.png",
        public_url="http://testserver/uploads/preview.png",
        content_type="image/png",
        size_bytes=128,
    )
    db_session.add_all([project, image])
    db_session.commit()

    assert client.get(f"/api/v1/projects/{project.id}/videos").status_code == 401

    invalid_asset = client.post(
        f"/api/v1/projects/{project.id}/videos/attach",
        json={"mediaAssetId": str(image.id)},
        headers=auth_headers(admin_user),
    )
    assert invalid_asset.status_code == 422
    assert invalid_asset.json()["errors"][0]["code"] == "invalid_project_video"

    invalid_host = client.post(
        f"/api/v1/projects/{project.id}/videos/external",
        json={"externalUrl": "https://example.com/video"},
        headers=auth_headers(admin_user),
    )
    assert invalid_host.status_code == 422


def test_admin_can_update_project_image_metadata(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    project = Project(
        title="Image Meta Project",
        slug="image-meta-project",
        summary="Test image metadata update",
        status="draft",
    )
    media = MediaAsset(
        filename="gallery.png",
        original_filename="gallery.png",
        storage_path="uploads/gallery.png",
        public_url="http://testserver/uploads/gallery.png",
        content_type="image/png",
        size_bytes=256,
    )
    db_session.add_all([project, media])
    db_session.commit()
    image = ProjectImage(
        project_id=project.id,
        media_asset_id=media.id,
        caption="Original caption",
        sort_order=0,
    )
    db_session.add(image)
    db_session.commit()
    db_session.refresh(image)
    headers = auth_headers(admin_user)

    response = client.patch(
        f"/api/v1/projects/{project.id}/images/{image.id}",
        json={"caption": "Updated caption", "sortOrder": 5},
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["caption"] == "Updated caption"
    assert payload["sortOrder"] == 5
    db_session.refresh(media)
    assert media.deleted_at is None


def test_admin_can_reorder_project_images(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    project = Project(
        title="Reorder Images Project",
        slug="reorder-images-project",
        summary="Test image reorder",
        status="draft",
    )
    media1 = MediaAsset(
        filename="img1.png",
        original_filename="img1.png",
        storage_path="uploads/img1.png",
        public_url="http://testserver/uploads/img1.png",
        content_type="image/png",
        size_bytes=128,
    )
    media2 = MediaAsset(
        filename="img2.png",
        original_filename="img2.png",
        storage_path="uploads/img2.png",
        public_url="http://testserver/uploads/img2.png",
        content_type="image/png",
        size_bytes=128,
    )
    db_session.add_all([project, media1, media2])
    db_session.commit()
    img1 = ProjectImage(project_id=project.id, media_asset_id=media1.id, sort_order=0)
    img2 = ProjectImage(project_id=project.id, media_asset_id=media2.id, sort_order=1)
    db_session.add_all([img1, img2])
    db_session.commit()
    db_session.refresh(img1)
    db_session.refresh(img2)
    headers = auth_headers(admin_user)

    response = client.patch(
        f"/api/v1/projects/{project.id}/images/reorder",
        json={
            "items": [
                {"id": str(img2.id), "sortOrder": 0},
                {"id": str(img1.id), "sortOrder": 1},
            ]
        },
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload[0]["id"] == str(img2.id)
    assert payload[0]["sortOrder"] == 0
    assert payload[1]["id"] == str(img1.id)
    assert payload[1]["sortOrder"] == 1
    db_session.refresh(media1)
    db_session.refresh(media2)
    assert media1.deleted_at is None
    assert media2.deleted_at is None


def test_admin_can_reorder_project_videos(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    project = Project(
        title="Reorder Videos Project",
        slug="reorder-videos-project",
        summary="Test video reorder",
        status="draft",
    )
    db_session.add(project)
    db_session.commit()
    vid1 = ProjectVideo(
        project_id=project.id,
        provider="youtube",
        external_url="https://www.youtube.com/watch?v=a1",
        sort_order=0,
    )
    vid2 = ProjectVideo(
        project_id=project.id,
        provider="vimeo",
        external_url="https://vimeo.com/222",
        sort_order=1,
    )
    db_session.add_all([vid1, vid2])
    db_session.commit()
    db_session.refresh(vid1)
    db_session.refresh(vid2)
    headers = auth_headers(admin_user)

    response = client.patch(
        f"/api/v1/projects/{project.id}/videos/reorder",
        json={
            "items": [
                {"id": str(vid2.id), "sortOrder": 0},
                {"id": str(vid1.id), "sortOrder": 1},
            ]
        },
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload[0]["id"] == str(vid2.id)
    assert payload[0]["sortOrder"] == 0
    assert payload[1]["id"] == str(vid1.id)
    assert payload[1]["sortOrder"] == 1


def test_reorder_rejects_duplicate_ids(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    project = Project(
        title="Dup IDs Project",
        slug="dup-ids-project",
        summary="Duplicate test",
        status="draft",
    )
    media = MediaAsset(
        filename="dup.png",
        original_filename="dup.png",
        storage_path="uploads/dup.png",
        public_url="http://testserver/uploads/dup.png",
        content_type="image/png",
        size_bytes=128,
    )
    db_session.add_all([project, media])
    db_session.commit()
    img = ProjectImage(project_id=project.id, media_asset_id=media.id, sort_order=0)
    db_session.add(img)
    db_session.commit()
    db_session.refresh(img)
    headers = auth_headers(admin_user)

    response = client.patch(
        f"/api/v1/projects/{project.id}/images/reorder",
        json={
            "items": [
                {"id": str(img.id), "sortOrder": 0},
                {"id": str(img.id), "sortOrder": 1},
            ]
        },
        headers=headers,
    )

    assert response.status_code == 422


def test_reorder_rejects_duplicate_sort_orders(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    project = Project(
        title="Duplicate Positions",
        slug="duplicate-positions",
        summary="Reject duplicate positions",
        status="draft",
    )
    media1 = MediaAsset(
        filename="position-1.png",
        original_filename="position-1.png",
        storage_path="uploads/position-1.png",
        public_url="http://testserver/uploads/position-1.png",
        content_type="image/png",
        size_bytes=128,
    )
    media2 = MediaAsset(
        filename="position-2.png",
        original_filename="position-2.png",
        storage_path="uploads/position-2.png",
        public_url="http://testserver/uploads/position-2.png",
        content_type="image/png",
        size_bytes=128,
    )
    db_session.add_all([project, media1, media2])
    db_session.commit()
    image1 = ProjectImage(project_id=project.id, media_asset_id=media1.id, sort_order=0)
    image2 = ProjectImage(project_id=project.id, media_asset_id=media2.id, sort_order=1)
    db_session.add_all([image1, image2])
    db_session.commit()

    response = client.patch(
        f"/api/v1/projects/{project.id}/images/reorder",
        json={
            "items": [
                {"id": str(image1.id), "sortOrder": 0},
                {"id": str(image2.id), "sortOrder": 0},
            ]
        },
        headers=auth_headers(admin_user),
    )

    assert response.status_code == 422
    db_session.refresh(image1)
    db_session.refresh(image2)
    assert (image1.sort_order, image2.sort_order) == (0, 1)


def test_reorder_requires_complete_project_media_list(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    project = Project(
        title="Complete Reorder",
        slug="complete-reorder",
        summary="Require all active items",
        status="draft",
    )
    video1 = ProjectVideo(
        project=project,
        provider="youtube",
        external_url="https://www.youtube.com/watch?v=complete1",
        sort_order=0,
    )
    video2 = ProjectVideo(
        project=project,
        provider="vimeo",
        external_url="https://vimeo.com/987654",
        sort_order=1,
    )
    db_session.add_all([project, video1, video2])
    db_session.commit()

    response = client.patch(
        f"/api/v1/projects/{project.id}/videos/reorder",
        json={"items": [{"id": str(video2.id), "sortOrder": 0}]},
        headers=auth_headers(admin_user),
    )

    assert response.status_code == 422
    assert response.json()["errors"][0]["code"] == "invalid_reorder_ids"
    db_session.refresh(video1)
    db_session.refresh(video2)
    assert (video1.sort_order, video2.sort_order) == (0, 1)


def test_reorder_rejects_ids_from_another_project(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    project1 = Project(
        title="Project One",
        slug="project-one",
        summary="First",
        status="draft",
    )
    project2 = Project(
        title="Project Two",
        slug="project-two",
        summary="Second",
        status="draft",
    )
    media = MediaAsset(
        filename="foreign.png",
        original_filename="foreign.png",
        storage_path="uploads/foreign.png",
        public_url="http://testserver/uploads/foreign.png",
        content_type="image/png",
        size_bytes=128,
    )
    db_session.add_all([project1, project2, media])
    db_session.commit()
    img = ProjectImage(project_id=project2.id, media_asset_id=media.id, sort_order=0)
    db_session.add(img)
    db_session.commit()
    db_session.refresh(img)
    headers = auth_headers(admin_user)

    response = client.patch(
        f"/api/v1/projects/{project1.id}/images/reorder",
        json={"items": [{"id": str(img.id), "sortOrder": 0}]},
        headers=headers,
    )

    assert response.status_code == 422
    assert response.json()["errors"][0]["code"] == "invalid_reorder_ids"


def test_reorder_rejects_missing_ids(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    project = Project(
        title="Missing IDs Project",
        slug="missing-ids-project",
        summary="Missing test",
        status="draft",
    )
    db_session.add(project)
    db_session.commit()
    headers = auth_headers(admin_user)

    response = client.patch(
        f"/api/v1/projects/{project.id}/images/reorder",
        json={"items": [{"id": "00000000-0000-0000-0000-000000000001", "sortOrder": 0}]},
        headers=headers,
    )

    assert response.status_code == 422
    assert response.json()["errors"][0]["code"] == "invalid_reorder_ids"


def test_reorder_requires_admin(client: TestClient, db_session: Session) -> None:
    project = Project(
        title="Auth Reorder",
        slug="auth-reorder",
        summary="Needs admin",
        status="draft",
    )
    db_session.add(project)
    db_session.commit()

    response = client.patch(
        f"/api/v1/projects/{project.id}/images/reorder",
        json={"items": [{"id": "00000000-0000-0000-0000-000000000001", "sortOrder": 0}]},
    )
    assert response.status_code == 401

    response = client.patch(
        f"/api/v1/projects/{project.id}/videos/reorder",
        json={"items": [{"id": "00000000-0000-0000-0000-000000000001", "sortOrder": 0}]},
    )
    assert response.status_code == 401


def test_image_update_requires_admin(client: TestClient, db_session: Session) -> None:
    project = Project(
        title="Auth Image Update",
        slug="auth-image-update",
        summary="Needs admin",
        status="draft",
    )
    db_session.add(project)
    db_session.commit()

    response = client.patch(
        f"/api/v1/projects/{project.id}/images/00000000-0000-0000-0000-000000000001",
        json={"caption": "Blocked"},
    )
    assert response.status_code == 401
