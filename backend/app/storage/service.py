from app.core.exceptions import ApiError
from app.core.settings import settings
from app.services.base import BaseService, ServiceResult
from app.storage.base import StorageProvider, StoredFile


class MediaStorageService(BaseService):
    def __init__(self, storage_provider: StorageProvider) -> None:
        self.storage_provider = storage_provider
        self.max_size_bytes = settings.max_upload_size_mb * 1024 * 1024

    async def save_upload(
        self,
        filename: str,
        content_type: str,
        content: bytes,
    ) -> ServiceResult[StoredFile]:
        if len(content) > self.max_size_bytes:
            raise ApiError(
                status_code=413,
                message="Uploaded file exceeds the configured size limit.",
                code="upload_too_large",
            )

        stored_file = await self.storage_provider.save(filename, content_type, content)
        return self.result(stored_file, message="File stored successfully.")
