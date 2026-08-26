from typing import Annotated

from app.auth.dependencies import CurrentUser, require_admin
from app.features.settings.dependencies import get_setting_service
from app.features.settings.schemas import SettingsPayload, SettingsUpdateRequest
from app.features.settings.service import SettingService
from app.schemas.base import ApiResponse
from fastapi import APIRouter, Depends

router = APIRouter()


@router.get("/public", response_model=ApiResponse[SettingsPayload])
async def public_settings(
    service: Annotated[SettingService, Depends(get_setting_service)],
) -> ApiResponse[SettingsPayload]:
    return ApiResponse(data=service.get_settings(public_only=True))


@router.get("", response_model=ApiResponse[SettingsPayload])
async def admin_settings(
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[SettingService, Depends(get_setting_service)],
) -> ApiResponse[SettingsPayload]:
    return ApiResponse(data=service.get_settings(public_only=False))


@router.patch("", response_model=ApiResponse[SettingsPayload])
async def update_settings(
    payload: SettingsUpdateRequest,
    user: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[SettingService, Depends(get_setting_service)],
) -> ApiResponse[SettingsPayload]:
    return ApiResponse(data=service.update_settings(payload, user.id), message="Settings updated.")
