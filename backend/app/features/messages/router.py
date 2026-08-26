from ipaddress import ip_address
from typing import Annotated
from uuid import UUID

from app.auth.dependencies import CurrentUser, require_admin
from app.features.messages.dependencies import get_message_service
from app.features.messages.schemas import (
    MessageCreateRequest,
    MessageListFilters,
    MessagePayload,
    MessageReceipt,
    MessageSortField,
    MessageUpdateRequest,
    SortDirection,
)
from app.features.messages.service import MessageService
from app.schemas.base import ApiResponse, PaginatedPayload
from fastapi import APIRouter, Depends, Query, Request, status

router = APIRouter()


@router.post("", response_model=ApiResponse[MessageReceipt], status_code=status.HTTP_201_CREATED)
async def create_message(
    payload: MessageCreateRequest,
    request: Request,
    service: Annotated[MessageService, Depends(get_message_service)],
) -> ApiResponse[MessageReceipt]:
    receipt = service.create_message(
        payload,
        ip_address=_resolve_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return ApiResponse(data=receipt, message="Message received.")


@router.get("", response_model=ApiResponse[PaginatedPayload[MessagePayload]])
async def list_messages(
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[MessageService, Depends(get_message_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 20,
    search: Annotated[str | None, Query(max_length=255)] = None,
    read: bool | None = None,
    archived: bool | None = None,
    starred: bool | None = None,
    sort: MessageSortField = MessageSortField.CREATED_AT,
    order: SortDirection = SortDirection.DESC,
) -> ApiResponse[PaginatedPayload[MessagePayload]]:
    return ApiResponse(
        data=service.list_messages(
            MessageListFilters(
                page=page,
                page_size=page_size,
                search=search,
                read=read,
                archived=archived,
                starred=starred,
                sort=sort,
                order=order,
            )
        )
    )


@router.get("/{message_id}", response_model=ApiResponse[MessagePayload])
async def get_message(
    message_id: UUID,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[MessageService, Depends(get_message_service)],
) -> ApiResponse[MessagePayload]:
    return ApiResponse(data=service.get_message(message_id))


@router.patch("/{message_id}", response_model=ApiResponse[MessagePayload])
async def update_message(
    message_id: UUID,
    payload: MessageUpdateRequest,
    user: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[MessageService, Depends(get_message_service)],
) -> ApiResponse[MessagePayload]:
    return ApiResponse(
        data=service.update_message(message_id, payload, user.id),
        message="Message updated.",
    )


@router.delete("/{message_id}", response_model=ApiResponse[dict[str, bool]])
async def delete_message(
    message_id: UUID,
    user: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[MessageService, Depends(get_message_service)],
) -> ApiResponse[dict[str, bool]]:
    return ApiResponse(data=service.delete_message(message_id, user.id), message="Message deleted.")


def _resolve_client_ip(request: Request) -> str | None:
    candidates = []
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        candidates.append(forwarded_for.split(",", maxsplit=1)[0].strip())
    if request.client:
        candidates.append(request.client.host)
    for candidate in candidates:
        try:
            return str(ip_address(candidate))
        except ValueError:
            continue
    return None
