from pathlib import Path
from uuid import uuid4

from app.core.settings import settings
from app.storage.base import StorageProvider, StoredFile, ensure_directory


class LocalStorageProvider(StorageProvider):
    def __init__(self, root: str = settings.upload_root) -> None:
        self.root = Path(root)
        ensure_directory(self.root)

    async def save(self, filename: str, content_type: str, content: bytes) -> StoredFile:
        storage_name = f"{uuid4()}-{filename}"
        target = self.root / storage_name
        target.write_bytes(content)

        return StoredFile(
            path=str(target),
            filename=filename,
            content_type=content_type,
            size=len(content),
        )

    async def delete(self, path: str) -> None:
        target = Path(path)

        if target.exists():
            target.unlink()
