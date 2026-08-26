from datetime import date, datetime
from uuid import UUID

from app.schemas.base import ApiSchema
from pydantic import Field, field_validator, model_validator


def clean_string_list(values: list[str]) -> list[str]:
    cleaned = [value.strip() for value in values if value.strip()]
    return list(dict.fromkeys(cleaned))


class TimelineDates(ApiSchema):
    start_date: date
    end_date: date | None = None
    current: bool = False

    @model_validator(mode="after")
    def validate_dates(self) -> "TimelineDates":
        if self.current and self.end_date is not None:
            raise ValueError("Current timeline entries cannot have an end date.")
        if self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("End date cannot be earlier than start date.")
        return self


class ExperiencePayload(ApiSchema):
    id: UUID
    company: str
    role: str
    employment_type: str | None
    location: str | None
    start_date: date
    end_date: date | None
    current: bool
    summary: str
    achievements: list[str]
    technologies: list[str]
    company_url: str | None
    sort_order: int
    published: bool
    created_at: datetime
    updated_at: datetime


class EducationPayload(ApiSchema):
    id: UUID
    institution: str
    degree: str
    field_of_study: str | None
    location: str | None
    start_date: date
    end_date: date | None
    current: bool
    description: str | None
    achievements: list[str]
    institution_url: str | None
    sort_order: int
    published: bool
    created_at: datetime
    updated_at: datetime


class ExperienceCreateRequest(TimelineDates):
    company: str = Field(min_length=2, max_length=180)
    role: str = Field(min_length=2, max_length=180)
    employment_type: str | None = Field(default=None, max_length=80)
    location: str | None = Field(default=None, max_length=180)
    summary: str = Field(min_length=2, max_length=4000)
    achievements: list[str] = Field(default_factory=list, max_length=30)
    technologies: list[str] = Field(default_factory=list, max_length=50)
    company_url: str | None = Field(default=None, max_length=1000)
    sort_order: int = Field(default=0, ge=0)
    published: bool = False

    @field_validator("achievements", "technologies")
    @classmethod
    def normalize_lists(cls, value: list[str]) -> list[str]:
        return clean_string_list(value)


class ExperienceUpdateRequest(ApiSchema):
    company: str | None = Field(default=None, min_length=2, max_length=180)
    role: str | None = Field(default=None, min_length=2, max_length=180)
    employment_type: str | None = Field(default=None, max_length=80)
    location: str | None = Field(default=None, max_length=180)
    start_date: date | None = None
    end_date: date | None = None
    current: bool | None = None
    summary: str | None = Field(default=None, min_length=2, max_length=4000)
    achievements: list[str] | None = Field(default=None, max_length=30)
    technologies: list[str] | None = Field(default=None, max_length=50)
    company_url: str | None = Field(default=None, max_length=1000)
    sort_order: int | None = Field(default=None, ge=0)
    published: bool | None = None

    @field_validator("achievements", "technologies")
    @classmethod
    def normalize_lists(cls, value: list[str] | None) -> list[str] | None:
        return clean_string_list(value) if value is not None else None


class EducationCreateRequest(TimelineDates):
    institution: str = Field(min_length=2, max_length=180)
    degree: str = Field(min_length=2, max_length=180)
    field_of_study: str | None = Field(default=None, max_length=180)
    location: str | None = Field(default=None, max_length=180)
    description: str | None = Field(default=None, max_length=4000)
    achievements: list[str] = Field(default_factory=list, max_length=30)
    institution_url: str | None = Field(default=None, max_length=1000)
    sort_order: int = Field(default=0, ge=0)
    published: bool = False

    @field_validator("achievements")
    @classmethod
    def normalize_achievements(cls, value: list[str]) -> list[str]:
        return clean_string_list(value)


class EducationUpdateRequest(ApiSchema):
    institution: str | None = Field(default=None, min_length=2, max_length=180)
    degree: str | None = Field(default=None, min_length=2, max_length=180)
    field_of_study: str | None = Field(default=None, max_length=180)
    location: str | None = Field(default=None, max_length=180)
    start_date: date | None = None
    end_date: date | None = None
    current: bool | None = None
    description: str | None = Field(default=None, max_length=4000)
    achievements: list[str] | None = Field(default=None, max_length=30)
    institution_url: str | None = Field(default=None, max_length=1000)
    sort_order: int | None = Field(default=None, ge=0)
    published: bool | None = None

    @field_validator("achievements")
    @classmethod
    def normalize_achievements(cls, value: list[str] | None) -> list[str] | None:
        return clean_string_list(value) if value is not None else None
