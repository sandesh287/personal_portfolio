from typing import Annotated
from uuid import UUID

from app.auth.dependencies import CurrentUser, require_admin
from app.features.projects.dependencies import get_project_service
from app.features.projects.schemas import (
    ProjectCategoryCreateRequest,
    ProjectCategoryPayload,
    ProjectCategoryUpdateRequest,
    ProjectCreateRequest,
    ProjectFilters,
    ProjectImagePayload,
    ProjectPayload,
    ProjectSortField,
    ProjectStatus,
    ProjectUpdateRequest,
    SortDirection,
    TechnologyCreateRequest,
    TechnologyPayload,
    TechnologyUpdateRequest,
)
from app.features.projects.service import ProjectService
from app.schemas.base import ApiResponse, PaginatedPayload
from app.services.dependencies import get_media_storage_service
from app.storage.service import MediaStorageService
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile

router = APIRouter()


@router.get("", response_model=ApiResponse[PaginatedPayload[ProjectPayload]])
async def list_projects(
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 20,
    search: str | None = None,
    category_id: Annotated[UUID | None, Query(alias="categoryId")] = None,
    technology_id: Annotated[UUID | None, Query(alias="technologyId")] = None,
    status: ProjectStatus | None = ProjectStatus.PUBLISHED,
    featured: bool | None = None,
    sort: ProjectSortField = ProjectSortField.SORT_ORDER,
    order: SortDirection = SortDirection.ASC,
) -> ApiResponse[PaginatedPayload[ProjectPayload]]:
    filters = ProjectFilters(
        page=page,
        page_size=page_size,
        search=search,
        category_id=category_id,
        technology_id=technology_id,
        status=status,
        featured=featured,
        sort=sort,
        order=order,
    )
    return ApiResponse(data=project_service.list_projects(filters))


@router.get("/featured", response_model=ApiResponse[list[ProjectPayload]])
async def list_featured_projects(
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    limit: Annotated[int, Query(ge=1, le=24)] = 6,
) -> ApiResponse[list[ProjectPayload]]:
    return ApiResponse(data=project_service.list_featured_projects(limit))


@router.get("/categories", response_model=ApiResponse[list[ProjectCategoryPayload]])
async def list_project_categories(
    project_service: Annotated[ProjectService, Depends(get_project_service)],
) -> ApiResponse[list[ProjectCategoryPayload]]:
    return ApiResponse(data=project_service.list_project_categories())


@router.get("/technologies", response_model=ApiResponse[list[TechnologyPayload]])
async def list_technologies(
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    category: str | None = None,
) -> ApiResponse[list[TechnologyPayload]]:
    return ApiResponse(data=project_service.list_technologies(category))


@router.post("/categories", response_model=ApiResponse[ProjectCategoryPayload], status_code=201)
async def create_project_category(
    payload: ProjectCategoryCreateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
) -> ApiResponse[ProjectCategoryPayload]:
    return ApiResponse(
        data=project_service.create_project_category(payload),
        message="Project category created.",
    )


@router.patch("/categories/{category_id}", response_model=ApiResponse[ProjectCategoryPayload])
async def update_project_category(
    category_id: UUID,
    payload: ProjectCategoryUpdateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
) -> ApiResponse[ProjectCategoryPayload]:
    return ApiResponse(
        data=project_service.update_project_category(category_id, payload),
        message="Project category updated.",
    )


@router.delete("/categories/{category_id}", response_model=ApiResponse[dict[str, bool]])
async def delete_project_category(
    category_id: UUID,
    _: Annotated[CurrentUser, Depends(require_admin)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
) -> ApiResponse[dict[str, bool]]:
    return ApiResponse(
        data=project_service.delete_project_category(category_id),
        message="Project category deleted.",
    )


@router.post("/technologies", response_model=ApiResponse[TechnologyPayload], status_code=201)
async def create_technology(
    payload: TechnologyCreateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
) -> ApiResponse[TechnologyPayload]:
    return ApiResponse(
        data=project_service.create_technology(payload), message="Technology created."
    )


@router.patch("/technologies/{technology_id}", response_model=ApiResponse[TechnologyPayload])
async def update_technology(
    technology_id: UUID,
    payload: TechnologyUpdateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
) -> ApiResponse[TechnologyPayload]:
    return ApiResponse(
        data=project_service.update_technology(technology_id, payload),
        message="Technology updated.",
    )


@router.delete("/technologies/{technology_id}", response_model=ApiResponse[dict[str, bool]])
async def delete_technology(
    technology_id: UUID,
    _: Annotated[CurrentUser, Depends(require_admin)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
) -> ApiResponse[dict[str, bool]]:
    return ApiResponse(
        data=project_service.delete_technology(technology_id),
        message="Technology deleted.",
    )


@router.get("/admin", response_model=ApiResponse[PaginatedPayload[ProjectPayload]])
async def list_admin_projects(
    _: Annotated[CurrentUser, Depends(require_admin)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 20,
    search: str | None = None,
    category_id: Annotated[UUID | None, Query(alias="categoryId")] = None,
    technology_id: Annotated[UUID | None, Query(alias="technologyId")] = None,
    status: ProjectStatus | None = None,
    featured: bool | None = None,
    sort: ProjectSortField = ProjectSortField.UPDATED_AT,
    order: SortDirection = SortDirection.DESC,
) -> ApiResponse[PaginatedPayload[ProjectPayload]]:
    filters = ProjectFilters(
        page=page,
        page_size=page_size,
        search=search,
        category_id=category_id,
        technology_id=technology_id,
        status=status,
        featured=featured,
        sort=sort,
        order=order,
    )
    return ApiResponse(data=project_service.list_projects(filters))


@router.get("/{slug}", response_model=ApiResponse[ProjectPayload])
async def get_project_details(
    slug: str,
    project_service: Annotated[ProjectService, Depends(get_project_service)],
) -> ApiResponse[ProjectPayload]:
    return ApiResponse(data=project_service.get_project_details(slug))


@router.post("", response_model=ApiResponse[ProjectPayload], status_code=201)
async def create_project(
    payload: ProjectCreateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
) -> ApiResponse[ProjectPayload]:
    return ApiResponse(data=project_service.create_project(payload), message="Project created.")


@router.patch("/{project_id}", response_model=ApiResponse[ProjectPayload])
async def update_project(
    project_id: UUID,
    payload: ProjectUpdateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
) -> ApiResponse[ProjectPayload]:
    return ApiResponse(
        data=project_service.update_project(project_id, payload),
        message="Project updated.",
    )


@router.delete("/{project_id}", response_model=ApiResponse[dict[str, bool]])
async def delete_project(
    project_id: UUID,
    _: Annotated[CurrentUser, Depends(require_admin)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
) -> ApiResponse[dict[str, bool]]:
    return ApiResponse(data=project_service.delete_project(project_id), message="Project deleted.")


@router.post(
    "/{project_id}/images",
    response_model=ApiResponse[ProjectImagePayload],
    status_code=201,
)
async def upload_project_image(
    project_id: UUID,
    _: Annotated[CurrentUser, Depends(require_admin)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    media_storage_service: Annotated[MediaStorageService, Depends(get_media_storage_service)],
    file: Annotated[UploadFile, File()],
    caption: Annotated[str | None, Form()] = None,
    sort_order: Annotated[int, Form(alias="sortOrder")] = 0,
) -> ApiResponse[ProjectImagePayload]:
    content = await file.read()
    return ApiResponse(
        data=await project_service.upload_project_image(
            project_id=project_id,
            filename=file.filename or "upload",
            content_type=file.content_type or "application/octet-stream",
            content=content,
            media_storage_service=media_storage_service,
            caption=caption,
            sort_order=sort_order,
        ),
        message="Project image uploaded.",
    )
