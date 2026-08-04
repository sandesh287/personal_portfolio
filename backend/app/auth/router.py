from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth.dependencies import CurrentUser, require_admin
from app.auth.schemas import (
    AuthTokens,
    CurrentUserPayload,
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
)
from app.auth.service import AuthService
from app.schemas.base import ApiResponse
from app.services.dependencies import get_auth_service

router = APIRouter()


@router.post("/login", response_model=ApiResponse[AuthTokens])
async def login(
    payload: LoginRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[AuthTokens]:
    return ApiResponse(data=auth_service.login(payload.email, payload.password))


@router.post("/refresh", response_model=ApiResponse[AuthTokens])
async def refresh_token(
    payload: RefreshTokenRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[AuthTokens]:
    return ApiResponse(data=auth_service.refresh(payload.refresh_token))


@router.post("/logout", response_model=ApiResponse[dict[str, bool]])
async def logout(
    payload: LogoutRequest,
    _: Annotated[CurrentUser, Depends(require_admin)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[dict[str, bool]]:
    return ApiResponse(data=auth_service.logout(payload.refresh_token))


@router.get("/me", response_model=ApiResponse[CurrentUserPayload])
async def read_current_user(
    current_user: Annotated[CurrentUser, Depends(require_admin)],
) -> ApiResponse[CurrentUserPayload]:
    return ApiResponse(
        data=CurrentUserPayload(
            id=current_user.id,
            email=current_user.email,
            role=current_user.role,
            is_active=current_user.is_active,
        ),
        message="Authenticated user resolved.",
    )
