from typing import Annotated

from app.dependencies import DatabaseSession
from app.features.analytics.repository import AnalyticsRepository
from app.features.analytics.service import AnalyticsService
from app.features.settings.repository import SettingRepository
from fastapi import Depends


def get_analytics_repository(db: DatabaseSession) -> AnalyticsRepository:
    return AnalyticsRepository(db)


def get_analytics_setting_repository(db: DatabaseSession) -> SettingRepository:
    return SettingRepository(db)


def get_analytics_service(
    repository: Annotated[AnalyticsRepository, Depends(get_analytics_repository)],
    settings: Annotated[SettingRepository, Depends(get_analytics_setting_repository)],
) -> AnalyticsService:
    return AnalyticsService(repository, settings)
