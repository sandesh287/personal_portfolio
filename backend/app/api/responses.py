from typing import TypeVar

from app.schemas.base import ApiResponse, EmptyResponse

DataT = TypeVar("DataT")


def success_response(data: DataT, message: str | None = None) -> ApiResponse[DataT]:
    return ApiResponse(data=data, message=message)


def empty_response(message: str | None = None) -> EmptyResponse:
    return EmptyResponse(message=message)
