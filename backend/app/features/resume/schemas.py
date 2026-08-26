from datetime import datetime
from uuid import UUID

from app.schemas.base import ApiSchema
from pydantic import Field


class ResumeVersionPayload(ApiSchema):
    id: UUID
    media_asset_id: UUID
    title: str
    version: str
    is_active: bool
    download_count: int
    notes: str | None
    filename: str
    public_url: str
    size_bytes: int
    created_at: datetime
    updated_at: datetime


class ResumeVersionUpdateRequest(ApiSchema):
    title: str | None = Field(default=None, min_length=2, max_length=160)
    version: str | None = Field(default=None, min_length=1, max_length=40)
    notes: str | None = Field(default=None, max_length=2000)
