from app.services.base import BaseService, ServiceResult
from app.storage.base import StorageProvider, StoredFile
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

        stored_file = await self.storage_provider.save(filename, content_type, content)
        return self.result(stored_file, message="File stored successfully.")
