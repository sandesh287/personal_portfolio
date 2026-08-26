from app.core.settings import Settings, settings
from app.storage.base import StorageProvider
from app.storage.cloudinary import CloudinaryStorageProvider
from app.storage.local import LocalStorageProvider


def get_storage_provider() -> StorageProvider:
    return build_storage_provider(settings)


def build_storage_provider(config: Settings) -> StorageProvider:
    if config.storage_provider == "cloudinary":
        return CloudinaryStorageProvider(config)
    return LocalStorageProvider(config.upload_root)
