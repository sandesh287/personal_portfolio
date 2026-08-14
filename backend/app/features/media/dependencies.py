from typing import Annotated

from app.dependencies import DatabaseSession
from app.features.media.repository import MediaRepository
from app.features.media.service import MediaService
from app.storage.base import StorageProvider
from app.storage.dependencies import get_storage_provider
from fastapi import Depends


def get_media_repository(db: DatabaseSession) -> MediaRepository:
    return MediaRepository(db)


def get_media_service(
    media_repository: Annotated[MediaRepository, Depends(get_media_repository)],
    storage: Annotated[StorageProvider, Depends(get_storage_provider)],
) -> MediaService:
    return MediaService(media_repository, storage)
