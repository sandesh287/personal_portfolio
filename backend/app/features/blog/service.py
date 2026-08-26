from datetime import UTC, datetime
from uuid import UUID

from app.core.exceptions import ApiError
from app.features.blog.repository import BlogRepository
from app.features.blog.schemas import (
    BlogCategoryCreateRequest,
    BlogCategoryPayload,
    BlogCategoryUpdateRequest,
    BlogFilters,
    BlogPostCreateRequest,
    BlogPostPayload,
    BlogPostSummaryPayload,
    BlogPostUpdateRequest,
    BlogStatus,
    BlogTagCreateRequest,
    BlogTagPayload,
    BlogTagUpdateRequest,
)
from app.models.blog import BlogCategory, BlogPost, BlogTag
from app.models.media_asset import MediaAsset
from app.schemas.base import PaginatedPayload
from app.utils.pagination import PaginationParams


class BlogService:
    def __init__(self, repository: BlogRepository) -> None:
        self.repository = repository

    def list_posts(self, filters: BlogFilters) -> PaginatedPayload[BlogPostSummaryPayload]:
        posts, total = self.repository.list_filtered(filters)
        return PaginatedPayload(
            items=[BlogPostSummaryPayload.model_validate(post) for post in posts],
            meta=PaginationParams(page=filters.page, page_size=filters.page_size).build_meta(total),
        )

    def list_featured_posts(self, limit: int) -> list[BlogPostSummaryPayload]:
        return [
            BlogPostSummaryPayload.model_validate(post)
            for post in self.repository.list_featured(limit)
        ]

    def get_public_post(self, slug: str) -> BlogPostPayload:
        post = self.repository.get_post_by_slug(slug)
        if post is None or post.status != BlogStatus.PUBLISHED:
            raise ApiError(
                status_code=404, message="Blog post not found.", code="blog_post_not_found"
            )
        return BlogPostPayload.model_validate(post)

    def get_admin_post(self, post_id: UUID) -> BlogPostPayload:
        return BlogPostPayload.model_validate(self._get_post(post_id))

    def create_post(self, payload: BlogPostCreateRequest) -> BlogPostPayload:
        if self.repository.post_slug_exists(payload.slug):
            raise ApiError(409, "Blog post slug already exists.", "duplicate_blog_post_slug")
        category = self._resolve_category(payload.category_id)
        tags = self._resolve_tags(payload.tag_ids)
        cover_image = self._resolve_cover_image(payload.cover_image_id)
        published_at = payload.published_at
        if payload.status == BlogStatus.PUBLISHED and published_at is None:
            published_at = datetime.now(UTC)
        post = BlogPost(
            title=payload.title,
            slug=payload.slug,
            excerpt=payload.excerpt,
            content=payload.content,
            category=category,
            cover_image=cover_image,
            status=payload.status,
            featured=payload.featured,
            reading_time_minutes=payload.reading_time_minutes,
            seo_title=payload.seo_title,
            seo_description=payload.seo_description,
            published_at=published_at,
        )
        post.tags = list(tags)
        self.repository.add(post)
        self.repository.db.commit()
        self.repository.db.refresh(post)
        return BlogPostPayload.model_validate(self._get_post(post.id))

    def update_post(self, post_id: UUID, payload: BlogPostUpdateRequest) -> BlogPostPayload:
        post = self._get_post(post_id)
        if payload.slug and self.repository.post_slug_exists(payload.slug, exclude_id=post_id):
            raise ApiError(409, "Blog post slug already exists.", "duplicate_blog_post_slug")
        update_data = payload.model_dump(exclude_unset=True)
        if "category_id" in update_data:
            post.category = self._resolve_category(payload.category_id)
            update_data.pop("category_id")
        if "cover_image_id" in update_data:
            post.cover_image = self._resolve_cover_image(payload.cover_image_id)
            update_data.pop("cover_image_id")
        if payload.tag_ids is not None:
            post.tags = list(self._resolve_tags(payload.tag_ids))
            update_data.pop("tag_ids")
        next_status = payload.status or BlogStatus(post.status)
        if next_status == BlogStatus.PUBLISHED and update_data.get("published_at") is None:
            update_data["published_at"] = post.published_at or datetime.now(UTC)
        for field, value in update_data.items():
            setattr(post, field, value)
        self.repository.db.commit()
        self.repository.db.refresh(post)
        return BlogPostPayload.model_validate(self._get_post(post.id))

    def delete_post(self, post_id: UUID) -> dict[str, bool]:
        self.repository.delete(self._get_post(post_id))
        self.repository.db.commit()
        return {"deleted": True}

    def list_categories(self) -> list[BlogCategoryPayload]:
        return [
            BlogCategoryPayload.model_validate(item) for item in self.repository.list_categories()
        ]

    def create_category(self, payload: BlogCategoryCreateRequest) -> BlogCategoryPayload:
        if self.repository.category_slug_exists(payload.slug):
            raise ApiError(
                409, "Blog category slug already exists.", "duplicate_blog_category_slug"
            )
        category = BlogCategory(**payload.model_dump())
        self.repository.db.add(category)
        self.repository.db.commit()
        self.repository.db.refresh(category)
        return BlogCategoryPayload.model_validate(category)

    def update_category(
        self, category_id: UUID, payload: BlogCategoryUpdateRequest
    ) -> BlogCategoryPayload:
        category = self.repository.get_category(category_id)
        if category is None:
            raise ApiError(404, "Blog category not found.", "blog_category_not_found")
        if payload.slug and self.repository.category_slug_exists(
            payload.slug, exclude_id=category_id
        ):
            raise ApiError(
                409, "Blog category slug already exists.", "duplicate_blog_category_slug"
            )
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(category, field, value)
        self.repository.db.commit()
        self.repository.db.refresh(category)
        return BlogCategoryPayload.model_validate(category)

    def delete_category(self, category_id: UUID) -> dict[str, bool]:
        category = self.repository.get_category(category_id)
        if category is None:
            raise ApiError(404, "Blog category not found.", "blog_category_not_found")
        if self.repository.count_posts_for_category(category_id):
            raise ApiError(
                409, "Blog category is assigned to one or more posts.", "blog_category_in_use"
            )
        category.mark_deleted()
        self.repository.db.commit()
        return {"deleted": True}

    def list_tags(self) -> list[BlogTagPayload]:
        return [BlogTagPayload.model_validate(item) for item in self.repository.list_tags()]

    def create_tag(self, payload: BlogTagCreateRequest) -> BlogTagPayload:
        if self.repository.tag_slug_exists(payload.slug):
            raise ApiError(409, "Blog tag slug already exists.", "duplicate_blog_tag_slug")
        tag = BlogTag(**payload.model_dump())
        self.repository.db.add(tag)
        self.repository.db.commit()
        self.repository.db.refresh(tag)
        return BlogTagPayload.model_validate(tag)

    def update_tag(self, tag_id: UUID, payload: BlogTagUpdateRequest) -> BlogTagPayload:
        tag = self.repository.get_tag(tag_id)
        if tag is None:
            raise ApiError(404, "Blog tag not found.", "blog_tag_not_found")
        if payload.slug and self.repository.tag_slug_exists(payload.slug, exclude_id=tag_id):
            raise ApiError(409, "Blog tag slug already exists.", "duplicate_blog_tag_slug")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(tag, field, value)
        self.repository.db.commit()
        self.repository.db.refresh(tag)
        return BlogTagPayload.model_validate(tag)

    def delete_tag(self, tag_id: UUID) -> dict[str, bool]:
        tag = self.repository.get_tag(tag_id)
        if tag is None:
            raise ApiError(404, "Blog tag not found.", "blog_tag_not_found")
        if self.repository.count_posts_for_tag(tag_id):
            raise ApiError(409, "Blog tag is assigned to one or more posts.", "blog_tag_in_use")
        tag.mark_deleted()
        self.repository.db.commit()
        return {"deleted": True}

    def _get_post(self, post_id: UUID) -> BlogPost:
        post = self.repository.get_post_by_id(post_id)
        if post is None:
            raise ApiError(404, "Blog post not found.", "blog_post_not_found")
        return post

    def _resolve_category(self, category_id: UUID | None) -> BlogCategory | None:
        if category_id is None:
            return None
        category = self.repository.get_category(category_id)
        if category is None:
            raise ApiError(422, "Blog category does not exist.", "invalid_blog_category")
        return category

    def _resolve_tags(self, tag_ids: list[UUID]) -> list[BlogTag]:
        tags = list(self.repository.list_tags_by_ids(tag_ids))
        if len(tags) != len(tag_ids):
            raise ApiError(422, "One or more blog tags do not exist.", "invalid_blog_tags")
        return tags

    def _resolve_cover_image(self, media_id: UUID | None) -> MediaAsset | None:
        if media_id is None:
            return None
        media = self.repository.db.get(MediaAsset, media_id)
        if (
            media is None
            or media.deleted_at is not None
            or not media.content_type.startswith("image/")
        ):
            raise ApiError(
                422,
                "Blog cover image must reference an active image asset.",
                "invalid_blog_cover_image",
            )
        return media
