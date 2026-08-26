from typing import Annotated
from uuid import UUID

from app.auth.dependencies import CurrentUser, require_admin
from app.features.skills.dependencies import get_skill_service
from app.features.skills.schemas import (
    SkillCreateRequest,
    SkillFilters,
    SkillPayload,
    SkillSortField,
    SkillUpdateRequest,
    SortDirection,
)
from app.features.skills.service import SkillService
from app.schemas.base import ApiResponse, PaginatedPayload
from fastapi import APIRouter, Depends, Query

router = APIRouter()


@router.get("", response_model=ApiResponse[PaginatedPayload[SkillPayload]])
async def list_skills(
    service: Annotated[SkillService, Depends(get_skill_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 50,
    search: str | None = None,
    category: str | None = None,
    level: Annotated[int | None, Query(ge=1, le=5)] = None,
    sort: SkillSortField = SkillSortField.SORT_ORDER,
    order: SortDirection = SortDirection.ASC,
) -> ApiResponse[PaginatedPayload[SkillPayload]]:
    return ApiResponse(
        data=service.list_skills(
            SkillFilters(
                page=page,
                page_size=page_size,
                search=search,
                category=category,
                level=level,
                sort=sort,
                order=order,
            )
        )
    )


@router.get("/grouped", response_model=ApiResponse[dict[str, list[SkillPayload]]])
async def grouped_skills(
    service: Annotated[SkillService, Depends(get_skill_service)],
) -> ApiResponse[dict[str, list[SkillPayload]]]:
    return ApiResponse(data=service.grouped_skills())


@router.post("", response_model=ApiResponse[SkillPayload], status_code=201)
async def create_skill(
    payload: SkillCreateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[SkillService, Depends(get_skill_service)],
) -> ApiResponse[SkillPayload]:
    return ApiResponse(data=service.create_skill(payload), message="Skill created.")


@router.patch("/{skill_id}", response_model=ApiResponse[SkillPayload])
async def update_skill(
    skill_id: UUID,
    payload: SkillUpdateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[SkillService, Depends(get_skill_service)],
) -> ApiResponse[SkillPayload]:
    return ApiResponse(data=service.update_skill(skill_id, payload), message="Skill updated.")


@router.delete("/{skill_id}", response_model=ApiResponse[dict[str, bool]])
async def delete_skill(
    skill_id: UUID,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[SkillService, Depends(get_skill_service)],
) -> ApiResponse[dict[str, bool]]:
    return ApiResponse(data=service.delete_skill(skill_id), message="Skill deleted.")
