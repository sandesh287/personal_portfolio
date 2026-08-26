from app.core.exceptions import ApiError
from app.services.base import BaseService, ServiceResult
from app.storage.base import StorageProvider, StoredFile
from app.storage.cloudinary import CloudinaryStorageError
from app.storage.upload_policy import validate_upload_size


class MediaStorageService(BaseService):
    def __init__(self, storage_provider: StorageProvider) -> None:
        self.storage_provider = storage_provider

    async def save_upload(
        self,
        filename: str,
        content_type: str,
        content: bytes,
    ) -> ServiceResult[StoredFile]:
        validate_upload_size(content_type, len(content))

        try:
            stored_file = await self.storage_provider.save(filename, content_type, content)
        except CloudinaryStorageError as exc:
            raise ApiError(
                status_code=502,
                message="Cloud storage could not save the uploaded file.",
                code="storage_upload_failed",
            ) from exc
        return self.result(stored_file, message="File stored successfully.")
