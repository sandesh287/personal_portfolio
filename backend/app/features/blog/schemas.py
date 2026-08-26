from datetime import datetime
from enum import StrEnum
from uuid import UUID

from app.schemas.base import ApiSchema
from pydantic import Field, field_validator


class BlogStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class BlogSortField(StrEnum):
    TITLE = "title"
    CREATED_AT = "createdAt"
    UPDATED_AT = "updatedAt"
    PUBLISHED_AT = "publishedAt"


class SortDirection(StrEnum):
    ASC = "asc"
    DESC = "desc"


class BlogCategoryPayload(ApiSchema):
    id: UUID
    name: str
    slug: str
    description: str | None = None
    sort_order: int


class BlogTagPayload(ApiSchema):
    id: UUID
    name: str
    slug: str
    color: str | None = None


class BlogCoverImagePayload(ApiSchema):
    id: UUID
    public_url: str | None
    alt_text: str | None
    image_width: int | None
    image_height: int | None
    placeholder_url: str | None


class BlogPostSummaryPayload(ApiSchema):
    id: UUID
    title: str
    slug: str
    excerpt: str
    category: BlogCategoryPayload | None = None
    tags: list[BlogTagPayload] = Field(default_factory=list)
    cover_image: BlogCoverImagePayload | None = None
    status: BlogStatus
    featured: bool
    reading_time_minutes: int
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class BlogPostPayload(BlogPostSummaryPayload):
    content: str
    seo_title: str | None = None
    seo_description: str | None = None


class BlogCategoryCreateRequest(ApiSchema):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=140, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = None
    sort_order: int = Field(default=0, ge=0)


class BlogCategoryUpdateRequest(ApiSchema):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=140,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )
    description: str | None = None
    sort_order: int | None = Field(default=None, ge=0)


class BlogTagCreateRequest(ApiSchema):
    name: str = Field(min_length=2, max_length=80)
    slug: str = Field(min_length=2, max_length=100, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    color: str | None = Field(default=None, max_length=32)


class BlogTagUpdateRequest(ApiSchema):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )
    color: str | None = Field(default=None, max_length=32)


class BlogPostCreateRequest(ApiSchema):
    title: str = Field(min_length=2, max_length=220)
    slug: str = Field(min_length=2, max_length=240, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    excerpt: str = Field(min_length=2, max_length=500)
    content: str = Field(min_length=1)
    category_id: UUID | None = None
    cover_image_id: UUID | None = None
    tag_ids: list[UUID] = Field(default_factory=list)
    status: BlogStatus = BlogStatus.DRAFT
    featured: bool = False
    reading_time_minutes: int = Field(default=1, ge=1)
    seo_title: str | None = Field(default=None, max_length=255)
    seo_description: str | None = Field(default=None, max_length=500)
    published_at: datetime | None = None

    @field_validator("tag_ids")
    @classmethod
    def unique_tag_ids(cls, value: list[UUID]) -> list[UUID]:
        return list(dict.fromkeys(value))


class BlogPostUpdateRequest(ApiSchema):
    title: str | None = Field(default=None, min_length=2, max_length=220)
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=240,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )
    excerpt: str | None = Field(default=None, min_length=2, max_length=500)
    content: str | None = Field(default=None, min_length=1)
    category_id: UUID | None = None
    cover_image_id: UUID | None = None
    tag_ids: list[UUID] | None = None
    status: BlogStatus | None = None
    featured: bool | None = None
    reading_time_minutes: int | None = Field(default=None, ge=1)
    seo_title: str | None = Field(default=None, max_length=255)
    seo_description: str | None = Field(default=None, max_length=500)
    published_at: datetime | None = None

    @field_validator("tag_ids")
    @classmethod
    def unique_tag_ids(cls, value: list[UUID] | None) -> list[UUID] | None:
        return list(dict.fromkeys(value)) if value is not None else None


class BlogFilters(ApiSchema):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    search: str | None = Field(default=None, max_length=255)
    category: str | None = Field(default=None, max_length=140)
    tag: str | None = Field(default=None, max_length=100)
    status: BlogStatus | None = None
    featured: bool | None = None
    sort: BlogSortField = BlogSortField.PUBLISHED_AT
    order: SortDirection = SortDirection.DESC
