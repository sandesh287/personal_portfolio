from app.storage.base import StorageProvider
from app.storage.local import LocalStorageProvider


def get_storage_provider() -> StorageProvider:
    return LocalStorageProvider()
