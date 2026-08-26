from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Request, Response

from app.auth.dependencies import CurrentUser, require_admin
from app.auth.schemas import (
    AuthSession,
    AuthTokens,
    CurrentUserPayload,
    LoginRequest,
)
from app.auth.service import AuthService
from app.core.exceptions import ApiError
from app.core.settings import settings
from app.schemas.base import ApiResponse
from app.services.dependencies import get_auth_service

router = APIRouter()


@router.post("/login", response_model=ApiResponse[AuthSession])
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[AuthSession]:
    _validate_browser_origin(request)
    tokens = auth_service.login(payload.email, payload.password)
    _set_refresh_cookie(response, tokens.refresh_token)
    return ApiResponse(data=_build_auth_session(tokens))


@router.post("/refresh", response_model=ApiResponse[AuthSession])
async def refresh_token(
    request: Request,
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    refresh_token: Annotated[str | None, Cookie(alias=settings.refresh_cookie_name)] = None,
) -> ApiResponse[AuthSession]:
    _validate_browser_origin(request)
    if refresh_token is None:
        raise ApiError(
            status_code=401,
            message="Refresh session is missing.",
            code="missing_refresh_token",
        )
    tokens = auth_service.refresh(refresh_token)
    _set_refresh_cookie(response, tokens.refresh_token)
    return ApiResponse(data=_build_auth_session(tokens))


@router.post("/logout", response_model=ApiResponse[dict[str, bool]])
async def logout(
    request: Request,
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    refresh_token: Annotated[str | None, Cookie(alias=settings.refresh_cookie_name)] = None,
) -> ApiResponse[dict[str, bool]]:
    _validate_browser_origin(request)
    result = auth_service.logout(refresh_token) if refresh_token else {"loggedOut": True}
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=f"{settings.api_v1_prefix}/auth",
        secure=settings.refresh_cookie_secure,
        httponly=True,
        samesite=settings.refresh_cookie_samesite,
    )
    return ApiResponse(data=result)


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


def _build_auth_session(tokens: AuthTokens) -> AuthSession:
    return AuthSession(
        access_token=tokens.access_token,
        token_type=tokens.token_type,
        expires_in=tokens.expires_in,
        user=tokens.user,
    )


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path=f"{settings.api_v1_prefix}/auth",
        secure=settings.refresh_cookie_secure,
        httponly=True,
        samesite=settings.refresh_cookie_samesite,
    )


def _validate_browser_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    if origin and origin not in settings.backend_cors_origins:
        raise ApiError(status_code=403, message="Origin is not allowed.", code="origin_not_allowed")
