from collections.abc import AsyncIterator
from typing import Annotated

from app.core.settings import Settings, get_settings
from app.dependencies import DatabaseSession
from app.features.github.repository import GitHubCacheRepository
from app.features.github.service import GitHubExplorerService
from app.features.settings.repository import SettingRepository
from app.integrations.github import GitHubClient
from fastapi import Depends


def get_github_cache_repository(db: DatabaseSession) -> GitHubCacheRepository:
    return GitHubCacheRepository(db)


def get_github_setting_repository(db: DatabaseSession) -> SettingRepository:
    return SettingRepository(db)


async def get_github_client(
    config: Annotated[Settings, Depends(get_settings)],
) -> AsyncIterator[GitHubClient]:
    client = GitHubClient(config)
    try:
        yield client
    finally:
        await client.close()


def get_github_service(
    cache_repository: Annotated[GitHubCacheRepository, Depends(get_github_cache_repository)],
    setting_repository: Annotated[SettingRepository, Depends(get_github_setting_repository)],
    client: Annotated[GitHubClient, Depends(get_github_client)],
    config: Annotated[Settings, Depends(get_settings)],
) -> GitHubExplorerService:
    return GitHubExplorerService(cache_repository, setting_repository, client, config)
