from typing import Annotated

from app.dependencies import DatabaseSession
from app.features.settings.repository import SettingRepository
from app.features.settings.service import SettingService
from fastapi import Depends


def get_setting_repository(db: DatabaseSession) -> SettingRepository:
    return SettingRepository(db)


def get_setting_service(
    repository: Annotated[SettingRepository, Depends(get_setting_repository)],
) -> SettingService:
    return SettingService(repository)
