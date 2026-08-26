from typing import Annotated
from uuid import UUID

from app.auth.dependencies import CurrentUser, require_admin
from app.features.resume.dependencies import get_resume_service
from app.features.resume.schemas import ResumeVersionPayload, ResumeVersionUpdateRequest
from app.features.resume.service import ResumeService
from app.schemas.base import ApiResponse
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from fastapi.responses import RedirectResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[ResumeVersionPayload])
async def active_resume(
    service: Annotated[ResumeService, Depends(get_resume_service)],
) -> ApiResponse[ResumeVersionPayload]:
    return ApiResponse(data=service.get_active())


@router.get(
    "/download",
    response_class=RedirectResponse,
    status_code=status.HTTP_307_TEMPORARY_REDIRECT,
)
async def download_resume(
    service: Annotated[ResumeService, Depends(get_resume_service)],
) -> RedirectResponse:
    return RedirectResponse(
        service.register_download(), status_code=status.HTTP_307_TEMPORARY_REDIRECT
    )


@router.get("/versions", response_model=ApiResponse[list[ResumeVersionPayload]])
async def list_resume_versions(
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[ResumeService, Depends(get_resume_service)],
) -> ApiResponse[list[ResumeVersionPayload]]:
    return ApiResponse(data=service.list_versions())


@router.post(
    "/versions",
    response_model=ApiResponse[ResumeVersionPayload],
    status_code=status.HTTP_201_CREATED,
)
async def upload_resume_version(
    user: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[ResumeService, Depends(get_resume_service)],
    file: Annotated[UploadFile, File()],
    title: Annotated[str, Form(min_length=2, max_length=160)],
    version: Annotated[str, Form(min_length=1, max_length=40)],
    notes: Annotated[str | None, Form(max_length=2000)] = None,
    is_active: Annotated[bool, Form(alias="isActive")] = False,
) -> ApiResponse[ResumeVersionPayload]:
    resume = await service.upload_version(
        file,
        title=title,
        version=version,
        notes=notes,
        is_active=is_active,
        actor_id=user.id,
    )
    return ApiResponse(data=resume, message="Resume version uploaded.")


@router.patch("/versions/{version_id}", response_model=ApiResponse[ResumeVersionPayload])
async def update_resume_version(
    version_id: UUID,
    payload: ResumeVersionUpdateRequest,
    user: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[ResumeService, Depends(get_resume_service)],
) -> ApiResponse[ResumeVersionPayload]:
    return ApiResponse(
        data=service.update_version(version_id, payload, user.id),
        message="Resume version updated.",
    )


@router.post("/versions/{version_id}/activate", response_model=ApiResponse[ResumeVersionPayload])
async def activate_resume_version(
    version_id: UUID,
    user: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[ResumeService, Depends(get_resume_service)],
) -> ApiResponse[ResumeVersionPayload]:
    return ApiResponse(data=service.activate(version_id, user.id), message="Active resume updated.")


@router.delete("/versions/{version_id}", response_model=ApiResponse[dict[str, bool]])
async def delete_resume_version(
    version_id: UUID,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[ResumeService, Depends(get_resume_service)],
) -> ApiResponse[dict[str, bool]]:
    return ApiResponse(data=service.delete_version(version_id), message="Resume version deleted.")
