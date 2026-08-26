from datetime import datetime
from enum import StrEnum
from uuid import UUID

from app.schemas.base import ApiSchema
from pydantic import EmailStr, Field, model_validator


class MessageSource(StrEnum):
    CONTACT_FORM = "contact_form"
    COMMUNICATION_TERMINAL = "communication_terminal"
    ADMIN_TEST = "admin_test"


class MessageSortField(StrEnum):
    CREATED_AT = "createdAt"
    NAME = "name"
    EMAIL = "email"
    SUBJECT = "subject"


class SortDirection(StrEnum):
    ASC = "asc"
    DESC = "desc"


class MessageCreateRequest(ApiSchema):
    name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    subject: str = Field(min_length=3, max_length=255)
    message: str = Field(min_length=10, max_length=10_000)
    source: MessageSource = MessageSource.CONTACT_FORM
    website: str = Field(default="", max_length=500, exclude=True)


class MessageReceipt(ApiSchema):
    id: UUID
    received: bool = True


class MessagePayload(ApiSchema):
    id: UUID
    name: str
    email: EmailStr
    subject: str
    message: str
    source: MessageSource
    read: bool
    starred: bool
    archived: bool
    created_at: datetime
    updated_at: datetime


class MessageUpdateRequest(ApiSchema):
    read: bool | None = None
    starred: bool | None = None
    archived: bool | None = None

    @model_validator(mode="after")
    def require_change(self) -> "MessageUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("At least one message state must be provided.")
        return self


class MessageListFilters(ApiSchema):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    search: str | None = Field(default=None, max_length=255)
    read: bool | None = None
    archived: bool | None = None
    starred: bool | None = None
    sort: MessageSortField = MessageSortField.CREATED_AT
    order: SortDirection = SortDirection.DESC
