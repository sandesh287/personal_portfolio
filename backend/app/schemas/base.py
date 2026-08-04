from datetime import datetime
from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


def to_camel(value: str) -> str:
    words = value.split("_")
    return words[0] + "".join(word.capitalize() for word in words[1:])


class ApiSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        from_attributes=True,
        populate_by_name=True,
    )


class EntitySchema(ApiSchema):
    id: UUID
    created_at: datetime
    updated_at: datetime


DataT = TypeVar("DataT")


class ErrorDetail(ApiSchema):
    code: str
    message: str
    field: str | None = None


class ApiResponse(ApiSchema, Generic[DataT]):
    success: bool = True
    data: DataT
    message: str | None = None
    errors: list[ErrorDetail] = Field(default_factory=list)


class EmptyResponse(ApiSchema):
    success: bool = True
    data: dict[str, str] = Field(default_factory=dict)
    message: str | None = None
    errors: list[ErrorDetail] = Field(default_factory=list)


class HealthPayload(ApiSchema):
    status: str
    version: str
    environment: str


class PaginationMeta(ApiSchema):
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next_page: bool
    has_previous_page: bool


class PaginatedPayload(ApiSchema, Generic[DataT]):
    items: list[DataT]
    meta: PaginationMeta
