from typing import Annotated

from app.integrations.github import GitHubService
from app.storage.base import StorageProvider
from app.storage.dependencies import get_storage_provider
from app.storage.service import MediaStorageService
from fastapi import Depends


def get_media_storage_service(
    storage_provider: Annotated[StorageProvider, Depends(get_storage_provider)],
) -> MediaStorageService:
    return MediaStorageService(storage_provider)


def get_github_service() -> GitHubService:
    return GitHubService()
