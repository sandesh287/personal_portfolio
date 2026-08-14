from typing import Annotated
from uuid import UUID

from app.auth.dependencies import require_admin
from app.features.media.dependencies import get_media_service
from app.features.media.schemas import MediaAssetListParams, MediaAssetSchema, MediaAssetUpdate
from app.features.media.service import MediaService
from app.schemas.base import ApiResponse, PaginatedPayload
from fastapi import APIRouter, Depends, File, Form, UploadFile, status

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("", response_model=ApiResponse[PaginatedPayload[MediaAssetSchema]])
async def list_media(
    params: Annotated[MediaAssetListParams, Depends()],
    service: Annotated[MediaService, Depends(get_media_service)],
) -> ApiResponse[PaginatedPayload[MediaAssetSchema]]:
    return ApiResponse(
        data=service.list_paginated(
            page=params.page,
            page_size=params.page_size,
            search=params.search,
            content_type=params.content_type,
            folder=params.folder,
            sort=params.sort,
            order=params.order,
        )
    )


@router.get("/{media_id}", response_model=ApiResponse[MediaAssetSchema])
async def get_media(
    media_id: UUID,
    service: Annotated[MediaService, Depends(get_media_service)],
) -> ApiResponse[MediaAssetSchema]:
    return ApiResponse(data=service.get_by_id(media_id))


@router.post(
    "",
    response_model=ApiResponse[MediaAssetSchema],
    status_code=status.HTTP_201_CREATED,
)
async def upload_media(
    file: Annotated[UploadFile, File()],
    service: Annotated[MediaService, Depends(get_media_service)],
    alt_text: Annotated[str | None, Form(alias="altText", max_length=255)] = None,
    folder: Annotated[str | None, Form(max_length=120)] = None,
) -> ApiResponse[MediaAssetSchema]:
    media = await service.upload(file, alt_text=alt_text, folder=folder)
    return ApiResponse(data=media, message="Media uploaded successfully.")


@router.patch("/{media_id}", response_model=ApiResponse[MediaAssetSchema])
async def update_media(
    media_id: UUID,
    payload: MediaAssetUpdate,
    service: Annotated[MediaService, Depends(get_media_service)],
) -> ApiResponse[MediaAssetSchema]:
    return ApiResponse(
        data=service.update(media_id, payload),
        message="Media updated successfully.",
    )


@router.delete("/{media_id}", response_model=ApiResponse[dict[str, bool]])
async def delete_media(
    media_id: UUID,
    service: Annotated[MediaService, Depends(get_media_service)],
) -> ApiResponse[dict[str, bool]]:
    return ApiResponse(
        data=await service.delete(media_id),
        message="Media deleted successfully.",
    )
