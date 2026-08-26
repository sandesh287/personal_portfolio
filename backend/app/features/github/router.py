from typing import Annotated

from app.auth.dependencies import CurrentUser, require_admin
from app.features.github.dependencies import get_github_service
from app.features.github.schemas import (
    GitHubActivityFilters,
    GitHubActivityPayload,
    GitHubListFilters,
    GitHubRepositoryPayload,
    GitHubRepositorySort,
    GitHubSummaryPayload,
    GitHubSyncPayload,
)
from app.features.github.service import GitHubExplorerService
from app.schemas.base import ApiResponse, PaginatedPayload
from fastapi import APIRouter, Depends, Query

router = APIRouter()


@router.get("/summary", response_model=ApiResponse[GitHubSummaryPayload])
async def github_summary(
    service: Annotated[GitHubExplorerService, Depends(get_github_service)],
) -> ApiResponse[GitHubSummaryPayload]:
    return ApiResponse(data=await service.get_summary())


@router.get(
    "/repositories",
    response_model=ApiResponse[PaginatedPayload[GitHubRepositoryPayload]],
)
async def github_repositories(
    service: Annotated[GitHubExplorerService, Depends(get_github_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 20,
    search: Annotated[str | None, Query(max_length=255)] = None,
    language: Annotated[str | None, Query(max_length=80)] = None,
    sort: GitHubRepositorySort = GitHubRepositorySort.UPDATED_AT,
    order: Annotated[str, Query(pattern="^(asc|desc)$")] = "desc",
) -> ApiResponse[PaginatedPayload[GitHubRepositoryPayload]]:
    filters = GitHubListFilters(
        page=page,
        page_size=page_size,
        search=search,
        language=language,
        sort=sort,
        order=order,
    )
    return ApiResponse(data=await service.list_repositories(filters))


@router.get("/activity", response_model=ApiResponse[PaginatedPayload[GitHubActivityPayload]])
async def github_activity(
    service: Annotated[GitHubExplorerService, Depends(get_github_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 20,
    type: Annotated[str | None, Query(max_length=80)] = None,
) -> ApiResponse[PaginatedPayload[GitHubActivityPayload]]:
    return ApiResponse(
        data=await service.list_activity(
            GitHubActivityFilters(page=page, page_size=page_size, type=type)
        )
    )


@router.post("/sync", response_model=ApiResponse[GitHubSyncPayload])
async def sync_github(
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[GitHubExplorerService, Depends(get_github_service)],
) -> ApiResponse[GitHubSyncPayload]:
    return ApiResponse(data=await service.sync(), message="GitHub cache refreshed.")
