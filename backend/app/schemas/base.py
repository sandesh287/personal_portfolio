from datetime import datetime
from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ApiSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


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
