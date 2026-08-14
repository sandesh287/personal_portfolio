import logging
from uuid import UUID

from app.core.exceptions import ApiError
from app.core.settings import settings
from app.features.media.repository import MediaRepository
from app.features.media.schemas import MediaAssetSchema, MediaAssetUpdate
from app.models.media_asset import MediaAsset
from app.schemas.base import PaginatedPayload
from app.storage.base import StorageProvider
from app.utils.pagination import PaginationParams
from fastapi import UploadFile

logger = logging.getLogger(__name__)


class MediaService:
    ALLOWED_CONTENT_TYPES = ("image/", "video/")
    ALLOWED_EXACT_CONTENT_TYPES = {"application/pdf"}

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
        self._validate_content_type(content_type)

        content = await file.read()
        if len(content) > settings.max_upload_size_mb * 1024 * 1024:
            raise ApiError(
                status_code=413,
                message="Uploaded file exceeds the configured size limit.",
                code="upload_too_large",
            )

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

    def _validate_content_type(self, content_type: str) -> None:
        if content_type in self.ALLOWED_EXACT_CONTENT_TYPES:
            return
        if any(content_type.startswith(prefix) for prefix in self.ALLOWED_CONTENT_TYPES):
            return
        raise ApiError(
            status_code=422,
            message="Only image, video, and PDF files are supported.",
            code="unsupported_media_type",
        )
