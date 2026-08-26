from enum import StrEnum
from uuid import UUID

from app.schemas.base import ApiSchema
from pydantic import Field


class SkillSortField(StrEnum):
    NAME = "name"
    CATEGORY = "category"
    LEVEL = "level"
    SORT_ORDER = "sortOrder"


class SortDirection(StrEnum):
    ASC = "asc"
    DESC = "desc"


class SkillPayload(ApiSchema):
    id: UUID
    technology_id: UUID | None
    name: str
    slug: str
    category: str
    level: int
    icon: str | None
    color: str | None
    description: str | None
    sort_order: int


class SkillCreateRequest(ApiSchema):
    technology_id: UUID | None = None
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=140, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    category: str = Field(min_length=2, max_length=80)
    level: int = Field(ge=1, le=5)
    icon: str | None = Field(default=None, max_length=120)
    color: str | None = Field(default=None, max_length=32)
    description: str | None = Field(default=None, max_length=2000)
    sort_order: int = Field(default=0, ge=0)


class SkillUpdateRequest(ApiSchema):
    technology_id: UUID | None = None
    name: str | None = Field(default=None, min_length=2, max_length=120)
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=140,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )
    category: str | None = Field(default=None, min_length=2, max_length=80)
    level: int | None = Field(default=None, ge=1, le=5)
    icon: str | None = Field(default=None, max_length=120)
    color: str | None = Field(default=None, max_length=32)
    description: str | None = Field(default=None, max_length=2000)
    sort_order: int | None = Field(default=None, ge=0)


class SkillFilters(ApiSchema):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=100)
    search: str | None = Field(default=None, max_length=255)
    category: str | None = Field(default=None, max_length=80)
    level: int | None = Field(default=None, ge=1, le=5)
    sort: SkillSortField = SkillSortField.SORT_ORDER
    order: SortDirection = SortDirection.ASC
