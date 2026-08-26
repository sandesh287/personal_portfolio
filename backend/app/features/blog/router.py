from typing import Annotated
from uuid import UUID

from app.auth.dependencies import CurrentUser, require_admin
from app.features.blog.dependencies import get_blog_service
from app.features.blog.schemas import (
    BlogCategoryCreateRequest,
    BlogCategoryPayload,
    BlogCategoryUpdateRequest,
    BlogFilters,
    BlogPostCreateRequest,
    BlogPostPayload,
    BlogPostSummaryPayload,
    BlogPostUpdateRequest,
    BlogSortField,
    BlogStatus,
    BlogTagCreateRequest,
    BlogTagPayload,
    BlogTagUpdateRequest,
    SortDirection,
)
from app.features.blog.service import BlogService
from app.schemas.base import ApiResponse, PaginatedPayload
from fastapi import APIRouter, Depends, Query

router = APIRouter()


@router.get("", response_model=ApiResponse[PaginatedPayload[BlogPostSummaryPayload]])
async def list_blog_posts(
    service: Annotated[BlogService, Depends(get_blog_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 20,
    search: str | None = None,
    category: str | None = None,
    tag: str | None = None,
    featured: bool | None = None,
    sort: BlogSortField = BlogSortField.PUBLISHED_AT,
    order: SortDirection = SortDirection.DESC,
) -> ApiResponse[PaginatedPayload[BlogPostSummaryPayload]]:
    return ApiResponse(
        data=service.list_posts(
            BlogFilters(
                page=page,
                page_size=page_size,
                search=search,
                category=category,
                tag=tag,
                status=BlogStatus.PUBLISHED,
                featured=featured,
                sort=sort,
                order=order,
            )
        )
    )


@router.get("/featured", response_model=ApiResponse[list[BlogPostSummaryPayload]])
async def list_featured_blog_posts(
    service: Annotated[BlogService, Depends(get_blog_service)],
    limit: Annotated[int, Query(ge=1, le=24)] = 6,
) -> ApiResponse[list[BlogPostSummaryPayload]]:
    return ApiResponse(data=service.list_featured_posts(limit))


@router.get("/categories", response_model=ApiResponse[list[BlogCategoryPayload]])
async def list_blog_categories(
    service: Annotated[BlogService, Depends(get_blog_service)],
) -> ApiResponse[list[BlogCategoryPayload]]:
    return ApiResponse(data=service.list_categories())


@router.post("/categories", response_model=ApiResponse[BlogCategoryPayload], status_code=201)
async def create_blog_category(
    payload: BlogCategoryCreateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[BlogService, Depends(get_blog_service)],
) -> ApiResponse[BlogCategoryPayload]:
    return ApiResponse(data=service.create_category(payload), message="Blog category created.")


@router.patch("/categories/{category_id}", response_model=ApiResponse[BlogCategoryPayload])
async def update_blog_category(
    category_id: UUID,
    payload: BlogCategoryUpdateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[BlogService, Depends(get_blog_service)],
) -> ApiResponse[BlogCategoryPayload]:
    return ApiResponse(
        data=service.update_category(category_id, payload), message="Blog category updated."
    )


@router.delete("/categories/{category_id}", response_model=ApiResponse[dict[str, bool]])
async def delete_blog_category(
    category_id: UUID,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[BlogService, Depends(get_blog_service)],
) -> ApiResponse[dict[str, bool]]:
    return ApiResponse(data=service.delete_category(category_id), message="Blog category deleted.")


@router.get("/tags", response_model=ApiResponse[list[BlogTagPayload]])
async def list_blog_tags(
    service: Annotated[BlogService, Depends(get_blog_service)],
) -> ApiResponse[list[BlogTagPayload]]:
    return ApiResponse(data=service.list_tags())


@router.post("/tags", response_model=ApiResponse[BlogTagPayload], status_code=201)
async def create_blog_tag(
    payload: BlogTagCreateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[BlogService, Depends(get_blog_service)],
) -> ApiResponse[BlogTagPayload]:
    return ApiResponse(data=service.create_tag(payload), message="Blog tag created.")


@router.patch("/tags/{tag_id}", response_model=ApiResponse[BlogTagPayload])
async def update_blog_tag(
    tag_id: UUID,
    payload: BlogTagUpdateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[BlogService, Depends(get_blog_service)],
) -> ApiResponse[BlogTagPayload]:
    return ApiResponse(data=service.update_tag(tag_id, payload), message="Blog tag updated.")


@router.delete("/tags/{tag_id}", response_model=ApiResponse[dict[str, bool]])
async def delete_blog_tag(
    tag_id: UUID,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[BlogService, Depends(get_blog_service)],
) -> ApiResponse[dict[str, bool]]:
    return ApiResponse(data=service.delete_tag(tag_id), message="Blog tag deleted.")


@router.get("/admin", response_model=ApiResponse[PaginatedPayload[BlogPostSummaryPayload]])
async def list_admin_blog_posts(
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[BlogService, Depends(get_blog_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 20,
    search: str | None = None,
    category: str | None = None,
    tag: str | None = None,
    status: BlogStatus | None = None,
    featured: bool | None = None,
    sort: BlogSortField = BlogSortField.UPDATED_AT,
    order: SortDirection = SortDirection.DESC,
) -> ApiResponse[PaginatedPayload[BlogPostSummaryPayload]]:
    filters = BlogFilters(
        page=page,
        page_size=page_size,
        search=search,
        category=category,
        tag=tag,
        status=status,
        featured=featured,
        sort=sort,
        order=order,
    )
    return ApiResponse(data=service.list_posts(filters))


@router.get("/admin/{post_id}", response_model=ApiResponse[BlogPostPayload])
async def get_admin_blog_post(
    post_id: UUID,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[BlogService, Depends(get_blog_service)],
) -> ApiResponse[BlogPostPayload]:
    return ApiResponse(data=service.get_admin_post(post_id))


@router.get("/{slug}", response_model=ApiResponse[BlogPostPayload])
async def get_blog_post(
    slug: str,
    service: Annotated[BlogService, Depends(get_blog_service)],
) -> ApiResponse[BlogPostPayload]:
    return ApiResponse(data=service.get_public_post(slug))


@router.post("", response_model=ApiResponse[BlogPostPayload], status_code=201)
async def create_blog_post(
    payload: BlogPostCreateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[BlogService, Depends(get_blog_service)],
) -> ApiResponse[BlogPostPayload]:
    return ApiResponse(data=service.create_post(payload), message="Blog post created.")


@router.patch("/admin/{post_id}", response_model=ApiResponse[BlogPostPayload])
async def update_blog_post(
    post_id: UUID,
    payload: BlogPostUpdateRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[BlogService, Depends(get_blog_service)],
) -> ApiResponse[BlogPostPayload]:
    return ApiResponse(data=service.update_post(post_id, payload), message="Blog post updated.")


@router.delete("/admin/{post_id}", response_model=ApiResponse[dict[str, bool]])
async def delete_blog_post(
    post_id: UUID,
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[BlogService, Depends(get_blog_service)],
) -> ApiResponse[dict[str, bool]]:
    return ApiResponse(data=service.delete_post(post_id), message="Blog post deleted.")
