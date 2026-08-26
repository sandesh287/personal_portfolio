from datetime import datetime
from enum import StrEnum
from uuid import UUID

from app.schemas.base import ApiSchema
from pydantic import Field, HttpUrl, field_validator


class ProjectStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class SortDirection(StrEnum):
    ASC = "asc"
    DESC = "desc"


class ProjectSortField(StrEnum):
    TITLE = "title"
    CREATED_AT = "createdAt"
    UPDATED_AT = "updatedAt"
    PUBLISHED_AT = "publishedAt"
    SORT_ORDER = "sortOrder"


class ProjectCategoryPayload(ApiSchema):
    id: UUID
    name: str
    slug: str
    description: str | None = None
    sort_order: int


class ProjectCategoryCreateRequest(ApiSchema):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=140, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = None
    sort_order: int = Field(default=0, ge=0)


class ProjectCategoryUpdateRequest(ApiSchema):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=140,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )
    description: str | None = None
    sort_order: int | None = Field(default=None, ge=0)


class TechnologyPayload(ApiSchema):
    id: UUID
    name: str
    slug: str
    category: str
    icon: str | None = None
    color: str | None = None
    sort_order: int


class TechnologyCreateRequest(ApiSchema):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=140, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    category: str = Field(min_length=2, max_length=80)
    icon: str | None = Field(default=None, max_length=120)
    color: str | None = Field(default=None, max_length=32)
    sort_order: int = Field(default=0, ge=0)


class TechnologyUpdateRequest(ApiSchema):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=140,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )
    category: str | None = Field(default=None, min_length=2, max_length=80)
    icon: str | None = Field(default=None, max_length=120)
    color: str | None = Field(default=None, max_length=32)
    sort_order: int | None = Field(default=None, ge=0)


class ProjectImagePayload(ApiSchema):
    id: UUID
    media_asset_id: UUID
    url: str | None = None
    caption: str | None = None
    sort_order: int
    image_width: int | None = None
    image_height: int | None = None
    placeholder_url: str | None = None


class ProjectCoverImageRequest(ApiSchema):
    image_id: UUID | None = None


class ProjectImageAttachRequest(ApiSchema):
    media_asset_id: UUID
    caption: str | None = Field(default=None, max_length=255)
    sort_order: int = Field(default=0, ge=0)


class ProjectVideoPayload(ApiSchema):
    id: UUID
    media_asset_id: UUID | None = None
    provider: str
    external_url: str | None = None
    url: str | None = None
    title: str | None = None
    caption: str | None = None
    sort_order: int


class ProjectVideoAttachRequest(ApiSchema):
    media_asset_id: UUID
    title: str | None = Field(default=None, max_length=180)
    caption: str | None = Field(default=None, max_length=255)
    sort_order: int = Field(default=0, ge=0)


class ProjectExternalVideoCreateRequest(ApiSchema):
    external_url: HttpUrl
    title: str | None = Field(default=None, max_length=180)
    caption: str | None = Field(default=None, max_length=255)
    sort_order: int = Field(default=0, ge=0)

    @field_validator("external_url")
    @classmethod
    def validate_video_host(cls, value: HttpUrl) -> HttpUrl:
        host = (value.host or "").lower()
        allowed_hosts = ("youtube.com", "youtu.be", "vimeo.com")
        if not any(host == allowed or host.endswith(f".{allowed}") for allowed in allowed_hosts):
            raise ValueError("Only YouTube and Vimeo URLs are supported.")
        return value


class ProjectVideoUpdateRequest(ApiSchema):
    title: str | None = Field(default=None, max_length=180)
    caption: str | None = Field(default=None, max_length=255)
    sort_order: int | None = Field(default=None, ge=0)


class ProjectImageUpdateRequest(ApiSchema):
    caption: str | None = Field(default=None, max_length=255)
    sort_order: int | None = Field(default=None, ge=0)


class ReorderItem(ApiSchema):
    id: UUID
    sort_order: int = Field(ge=0)


class ReorderRequest(ApiSchema):
    items: list[ReorderItem] = Field(min_length=1)

    @field_validator("items")
    @classmethod
    def unique_ids(cls, value: list[ReorderItem]) -> list[ReorderItem]:
        ids = [item.id for item in value]
        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate IDs are not allowed.")

        sort_orders = [item.sort_order for item in value]
        if len(sort_orders) != len(set(sort_orders)):
            raise ValueError("Duplicate sort orders are not allowed.")
        if set(sort_orders) != set(range(len(value))):
            raise ValueError("Sort orders must be contiguous and start at zero.")
        return value


class ProjectPayload(ApiSchema):
    id: UUID
    title: str
    slug: str
    summary: str
    description: str | None = None
    category: ProjectCategoryPayload | None = None
    technologies: list[TechnologyPayload] = Field(default_factory=list)
    images: list[ProjectImagePayload] = Field(default_factory=list)
    videos: list[ProjectVideoPayload] = Field(default_factory=list)
    cover_image_id: UUID | None = None
    repository_url: str | None = None
    live_url: str | None = None
    case_study_url: str | None = None
    status: ProjectStatus
    featured: bool
    sort_order: int
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class ProjectCreateRequest(ApiSchema):
    title: str = Field(min_length=2, max_length=180)
    slug: str = Field(min_length=2, max_length=200, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    summary: str = Field(min_length=2, max_length=500)
    description: str | None = None
    category_id: UUID | None = None
    technology_ids: list[UUID] = Field(default_factory=list)
    cover_image_id: UUID | None = None
    repository_url: HttpUrl | None = None
    live_url: HttpUrl | None = None
    case_study_url: HttpUrl | None = None
    status: ProjectStatus = ProjectStatus.DRAFT
    featured: bool = False
    sort_order: int = 0

    @field_validator("technology_ids")
    @classmethod
    def unique_technology_ids(cls, value: list[UUID]) -> list[UUID]:
        return list(dict.fromkeys(value))


class ProjectUpdateRequest(ApiSchema):
    title: str | None = Field(default=None, min_length=2, max_length=180)
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )
    summary: str | None = Field(default=None, min_length=2, max_length=500)
    description: str | None = None
    category_id: UUID | None = None
    technology_ids: list[UUID] | None = None
    cover_image_id: UUID | None = None
    repository_url: HttpUrl | None = None
    live_url: HttpUrl | None = None
    case_study_url: HttpUrl | None = None
    status: ProjectStatus | None = None
    featured: bool | None = None
    sort_order: int | None = None

    @field_validator("technology_ids")
    @classmethod
    def unique_technology_ids(cls, value: list[UUID] | None) -> list[UUID] | None:
        if value is None:
            return None
        return list(dict.fromkeys(value))


class ProjectFilters(ApiSchema):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    search: str | None = None
    category_id: UUID | None = None
    technology_id: UUID | None = None
    status: ProjectStatus | None = None
    featured: bool | None = None
    sort: ProjectSortField = ProjectSortField.SORT_ORDER
    order: SortDirection = SortDirection.ASC
