from datetime import datetime
from typing import Literal
from uuid import UUID

from app.schemas.base import ApiSchema
from pydantic import Field


class MediaAssetUpdate(ApiSchema):
    alt_text: str | None = Field(default=None, max_length=255)
    folder: str | None = Field(default=None, max_length=120)


class MediaAssetSchema(ApiSchema):
    id: UUID
    filename: str
    original_filename: str
    public_url: str | None
    content_type: str
    size_bytes: int
    alt_text: str | None
    folder: str | None
    created_at: datetime
    updated_at: datetime


class MediaAssetListParams(ApiSchema):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    search: str | None = Field(default=None, max_length=255)
    content_type: str | None = Field(default=None, max_length=100)
    folder: str | None = Field(default=None, max_length=120)
    sort: Literal["created_at", "original_filename", "size_bytes"] = "created_at"
    order: Literal["asc", "desc"] = "desc"
