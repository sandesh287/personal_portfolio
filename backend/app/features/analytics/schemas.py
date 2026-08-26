from datetime import date, datetime
from enum import StrEnum
from typing import Any

from app.schemas.base import ApiSchema
from pydantic import ConfigDict, Field, field_validator


class AnalyticsEventName(StrEnum):
    PAGE_VIEWED = "page_viewed"
    PROJECT_VIEWED = "project_viewed"
    BLOG_VIEWED = "blog_viewed"
    RESUME_VIEWED = "resume_viewed"
    RESUME_DOWNLOADED = "resume_downloaded"
    GITHUB_VIEWED = "github_viewed"
    CONTACT_SUBMITTED = "contact_submitted"


class AnalyticsEventCreate(ApiSchema):
    model_config = ConfigDict(
        alias_generator=ApiSchema.model_config["alias_generator"],
        populate_by_name=True,
        extra="forbid",
    )

    event_name: AnalyticsEventName
    path: str | None = Field(default=None, max_length=500)
    metadata: dict[str, str | int | float | bool | None] = Field(default_factory=dict)
    visitor_id: str | None = Field(default=None, min_length=16, max_length=64)

    @field_validator("path")
    @classmethod
    def validate_path(cls, value: str | None) -> str | None:
        if value is not None and not value.startswith("/"):
            raise ValueError("Path must be application-relative.")
        return value

    @field_validator("metadata")
    @classmethod
    def limit_metadata(cls, value: dict[str, Any]) -> dict[str, Any]:
        if len(value) > 10:
            raise ValueError("Metadata cannot contain more than 10 fields.")
        return value


class AnalyticsReceipt(ApiSchema):
    tracked: bool


class AnalyticsMetric(ApiSchema):
    key: str
    label: str
    value: int
    change: float | None = None


class PopularContent(ApiSchema):
    path: str
    views: int


class AnalyticsSummary(ApiSchema):
    from_date: datetime
    to_date: datetime
    metrics: list[AnalyticsMetric]
    popular_content: list[PopularContent]


class AnalyticsInterval(StrEnum):
    DAY = "day"
    WEEK = "week"
    MONTH = "month"


class AnalyticsPoint(ApiSchema):
    date: date
    value: int


class AnalyticsTimeSeries(ApiSchema):
    metric: str
    interval: AnalyticsInterval
    points: list[AnalyticsPoint]
