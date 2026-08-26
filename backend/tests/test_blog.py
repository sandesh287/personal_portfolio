from datetime import UTC, datetime

from app.auth.security import create_access_token
from app.models.blog import BlogCategory, BlogPost, BlogTag
from app.models.media_asset import MediaAsset
from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def auth_headers(admin_user: User) -> dict[str, str]:
    token = create_access_token(str(admin_user.id), {"role": admin_user.role})
    return {"Authorization": f"Bearer {token}"}


def seed_taxonomy(db: Session) -> tuple[BlogCategory, BlogTag]:
    category = BlogCategory(name="Frontend", slug="frontend", sort_order=1)
    tag = BlogTag(name="React", slug="react", color="#149eca")
    db.add_all([category, tag])
    db.commit()
    db.refresh(category)
    db.refresh(tag)
    return category, tag


def create_post(
    db: Session,
    *,
    title: str,
    slug: str,
    status: str = "published",
    featured: bool = False,
    category: BlogCategory | None = None,
    tags: list[BlogTag] | None = None,
) -> BlogPost:
    post = BlogPost(
        title=title,
        slug=slug,
        excerpt=f"{title} excerpt",
        content=f"Detailed engineering content for {title}",
        status=status,
        featured=featured,
        reading_time_minutes=4,
        published_at=datetime.now(UTC) if status == "published" else None,
        category=category,
    )
    post.tags = tags or []
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def test_public_blog_list_only_returns_published_posts(
    client: TestClient, db_session: Session
) -> None:
    create_post(db_session, title="Published Note", slug="published-note")
    create_post(db_session, title="Draft Note", slug="draft-note", status="draft")

    response = client.get("/api/v1/blog")

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["meta"]["totalItems"] == 1
    assert payload["items"][0]["slug"] == "published-note"
    assert "content" not in payload["items"][0]


def test_public_blog_supports_search_taxonomy_filters_sort_and_pagination(
    client: TestClient, db_session: Session
) -> None:
    category, tag = seed_taxonomy(db_session)
    create_post(
        db_session,
        title="React Query Architecture",
        slug="react-query-architecture",
        category=category,
        tags=[tag],
    )
    create_post(db_session, title="Python Notebook", slug="python-notebook")

    response = client.get(
        "/api/v1/blog",
        params={
            "search": "engineering content",
            "category": "frontend",
            "tag": "react",
            "sort": "title",
            "order": "asc",
            "page": 1,
            "pageSize": 1,
        },
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["meta"]["totalItems"] == 1
    assert payload["items"][0]["slug"] == "react-query-architecture"
    assert payload["items"][0]["category"]["slug"] == "frontend"
    assert payload["items"][0]["tags"][0]["slug"] == "react"


def test_featured_and_detail_endpoints_only_expose_published_posts(
    client: TestClient, db_session: Session
) -> None:
    create_post(db_session, title="Featured", slug="featured-note", featured=True)
    create_post(
        db_session,
        title="Draft Featured",
        slug="draft-featured",
        status="draft",
        featured=True,
    )

    featured = client.get("/api/v1/blog/featured")
    detail = client.get("/api/v1/blog/featured-note")
    hidden = client.get("/api/v1/blog/draft-featured")

    assert featured.status_code == 200
    assert [item["slug"] for item in featured.json()["data"]] == ["featured-note"]
    assert detail.status_code == 200
    assert detail.json()["data"]["content"].startswith("Detailed engineering content")
    assert hidden.status_code == 404


def test_admin_can_create_post_with_taxonomy_and_media_cover(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    category, tag = seed_taxonomy(db_session)
    cover = MediaAsset(
        filename="cover.png",
        original_filename="cover.png",
        storage_path="cloudinary|image|portfolio/cover",
        public_url="https://res.cloudinary.com/demo/image/upload/cover.png",
        content_type="image/png",
        size_bytes=100,
        image_width=1600,
        image_height=900,
    )
    db_session.add(cover)
    db_session.commit()
    db_session.refresh(cover)

    response = client.post(
        "/api/v1/blog",
        json={
            "title": "Typed API Design",
            "slug": "typed-api-design",
            "excerpt": "Designing reliable contracts.",
            "content": "Long-form technical content.",
            "categoryId": str(category.id),
            "tagIds": [str(tag.id), str(tag.id)],
            "coverImageId": str(cover.id),
            "status": "published",
            "featured": True,
            "readingTimeMinutes": 6,
        },
        headers=auth_headers(admin_user),
    )

    assert response.status_code == 201
    payload = response.json()["data"]
    assert payload["category"]["id"] == str(category.id)
    assert len(payload["tags"]) == 1
    assert payload["coverImage"]["imageWidth"] == 1600
    assert payload["publishedAt"] is not None


def test_admin_can_list_update_read_and_soft_delete_draft(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    post = create_post(db_session, title="Draft", slug="draft", status="draft")
    headers = auth_headers(admin_user)

    listed = client.get("/api/v1/blog/admin", headers=headers)
    detail = client.get(f"/api/v1/blog/admin/{post.id}", headers=headers)
    updated = client.patch(
        f"/api/v1/blog/admin/{post.id}",
        json={"status": "published", "title": "Published Draft"},
        headers=headers,
    )
    deleted = client.delete(f"/api/v1/blog/admin/{post.id}", headers=headers)

    assert listed.json()["data"]["meta"]["totalItems"] == 1
    assert detail.json()["data"]["content"]
    assert updated.json()["data"]["publishedAt"] is not None
    assert deleted.json()["data"] == {"deleted": True}
    assert client.get("/api/v1/blog/draft").status_code == 404


def test_blog_post_slug_must_be_unique(
    client: TestClient, db_session: Session, admin_user: User
) -> None:
    create_post(db_session, title="Existing", slug="existing")

    response = client.post(
        "/api/v1/blog",
        json={
            "title": "Duplicate",
            "slug": "existing",
            "excerpt": "Duplicate slug",
            "content": "Content",
        },
        headers=auth_headers(admin_user),
    )

    assert response.status_code == 409
    assert response.json()["errors"][0]["code"] == "duplicate_blog_post_slug"


def test_soft_deleted_blog_post_slug_cannot_be_reused(
    client: TestClient, db_session: Session, admin_user: User
) -> None:
    post = create_post(db_session, title="Existing", slug="reserved-slug")
    headers = auth_headers(admin_user)
    client.delete(f"/api/v1/blog/admin/{post.id}", headers=headers)

    response = client.post(
        "/api/v1/blog",
        json={
            "title": "Replacement",
            "slug": "reserved-slug",
            "excerpt": "Duplicate slug",
            "content": "Content",
        },
        headers=headers,
    )

    assert response.status_code == 409
    assert response.json()["errors"][0]["code"] == "duplicate_blog_post_slug"


def test_blog_taxonomy_crud_and_ordering(client: TestClient, admin_user: User) -> None:
    headers = auth_headers(admin_user)
    category = client.post(
        "/api/v1/blog/categories",
        json={"name": "Backend", "slug": "backend", "sortOrder": 2},
        headers=headers,
    )
    tag = client.post(
        "/api/v1/blog/tags",
        json={"name": "FastAPI", "slug": "fastapi", "color": "#059669"},
        headers=headers,
    )

    assert category.status_code == 201
    assert tag.status_code == 201
    category_id = category.json()["data"]["id"]
    tag_id = tag.json()["data"]["id"]
    assert (
        client.patch(
            f"/api/v1/blog/categories/{category_id}",
            json={"sortOrder": 1},
            headers=headers,
        ).status_code
        == 200
    )
    assert (
        client.patch(
            f"/api/v1/blog/tags/{tag_id}", json={"name": "FastAPI 2"}, headers=headers
        ).status_code
        == 200
    )
    assert client.get("/api/v1/blog/categories").json()["data"][0]["sortOrder"] == 1
    assert client.get("/api/v1/blog/tags").json()["data"][0]["name"] == "FastAPI 2"
    assert (
        client.delete(f"/api/v1/blog/categories/{category_id}", headers=headers).status_code == 200
    )
    assert client.delete(f"/api/v1/blog/tags/{tag_id}", headers=headers).status_code == 200


def test_assigned_blog_taxonomy_and_cover_media_cannot_be_deleted(
    client: TestClient,
    db_session: Session,
    admin_user: User,
) -> None:
    category, tag = seed_taxonomy(db_session)
    post = create_post(
        db_session,
        title="Referenced",
        slug="referenced",
        category=category,
        tags=[tag],
    )
    media = MediaAsset(
        filename="cover.png",
        original_filename="cover.png",
        storage_path="uploads/cover.png",
        public_url="/uploads/cover.png",
        content_type="image/png",
        size_bytes=10,
    )
    post.cover_image = media
    db_session.commit()
    headers = auth_headers(admin_user)

    category_delete = client.delete(f"/api/v1/blog/categories/{category.id}", headers=headers)
    tag_delete = client.delete(f"/api/v1/blog/tags/{tag.id}", headers=headers)
    media_delete = client.delete(f"/api/v1/media/{media.id}", headers=headers)

    assert category_delete.status_code == 409
    assert tag_delete.status_code == 409
    assert media_delete.status_code == 409


def test_blog_mutations_require_admin(client: TestClient) -> None:
    response = client.post(
        "/api/v1/blog",
        json={"title": "Note", "slug": "note", "excerpt": "Excerpt", "content": "Body"},
    )
    assert response.status_code == 401


def test_blog_validation_rejects_invalid_slug_and_reading_time(
    client: TestClient, admin_user: User
) -> None:
    response = client.post(
        "/api/v1/blog",
        json={
            "title": "Invalid",
            "slug": "Invalid Slug",
            "excerpt": "Excerpt",
            "content": "Body",
            "readingTimeMinutes": 0,
        },
        headers=auth_headers(admin_user),
    )
    assert response.status_code == 422
