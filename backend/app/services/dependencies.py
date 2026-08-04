from typing import Annotated

from app.auth.service import AuthService
from app.dependencies import DatabaseSession
from app.integrations.github import GitHubService
from app.repositories.dependencies import get_refresh_token_repository, get_user_repository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
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


def get_auth_service(
    db: DatabaseSession,
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
    refresh_token_repository: Annotated[
        RefreshTokenRepository,
        Depends(get_refresh_token_repository),
    ],
) -> AuthService:
    return AuthService(
        db=db,
        user_repository=user_repository,
        refresh_token_repository=refresh_token_repository,
    )
