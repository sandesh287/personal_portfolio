import logging
from uuid import UUID

from app.core.exceptions import ApiError
from app.features.media.repository import MediaRepository
from app.features.media.schemas import MediaAssetSchema, MediaAssetUpdate
from app.models.media_asset import MediaAsset
from app.schemas.base import PaginatedPayload
from app.storage.base import StorageProvider
from app.storage.upload_policy import classify_upload, validate_upload_size
from app.utils.pagination import PaginationParams
from fastapi import UploadFile

logger = logging.getLogger(__name__)


class MediaService:
    def __init__(self, repository: MediaRepository, storage: StorageProvider) -> None:
        self.repository = repository
        self.storage = storage

    async def upload(
        self,
        file: UploadFile,
        *,
        alt_text: str | None = None,
        folder: str | None = None,
    ) -> MediaAssetSchema:
        original_filename = file.filename or "unnamed"
        content_type = file.content_type or "application/octet-stream"
        classify_upload(content_type)

        content = await file.read()
        validate_upload_size(content_type, len(content))

        stored = await self.storage.save(original_filename, content_type, content)
        media = MediaAsset(
            filename=stored.filename,
            original_filename=original_filename,
            storage_path=stored.path,
            public_url=stored.public_url,
            content_type=stored.content_type,
            size_bytes=stored.size,
            alt_text=alt_text,
            folder=folder,
        )
        self.repository.add(media)
        try:
            self.repository.db.commit()
            self.repository.db.refresh(media)
        except Exception:
            self.repository.db.rollback()
            await self.storage.delete(stored.path)
            raise
        return MediaAssetSchema.model_validate(media)

    def get_by_id(self, media_id: UUID) -> MediaAssetSchema:
        media = self._get_media(media_id)
        return MediaAssetSchema.model_validate(media)

    def list_paginated(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None,
        content_type: str | None,
        folder: str | None,
        sort: str,
        order: str,
    ) -> PaginatedPayload[MediaAssetSchema]:
        items, total = self.repository.list_filtered(
            page=page,
            page_size=page_size,
            search=search,
            content_type=content_type,
            folder=folder,
            sort=sort,
            order=order,
        )
        pagination = PaginationParams(page=page, page_size=page_size)
        return PaginatedPayload(
            items=[MediaAssetSchema.model_validate(item) for item in items],
            meta=pagination.build_meta(total),
        )

    def update(self, media_id: UUID, payload: MediaAssetUpdate) -> MediaAssetSchema:
        media = self._get_media(media_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(media, field, value)
        self.repository.db.commit()
        self.repository.db.refresh(media)
        return MediaAssetSchema.model_validate(media)

    async def delete(self, media_id: UUID) -> dict[str, bool]:
        media = self._get_media(media_id)
        if self.repository.is_referenced(media_id):
            raise ApiError(
                status_code=409,
                message="Media asset is currently in use.",
                code="media_asset_in_use",
            )

        self.repository.delete(media)
        self.repository.db.commit()
        try:
            await self.storage.delete(media.storage_path)
        except OSError:
            logger.exception(
                "Unable to remove stored media file", extra={"media_id": str(media_id)}
            )
        return {"deleted": True}

    def _get_media(self, media_id: UUID) -> MediaAsset:
        media = self.repository.get_by_id(media_id)
        if media is None or media.deleted_at is not None:
            raise ApiError(
                status_code=404, message="Media asset not found.", code="media_not_found"
            )
        return media
