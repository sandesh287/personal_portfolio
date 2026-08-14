from pathlib import Path
from urllib.parse import quote
from uuid import uuid4

from app.core.settings import settings
from app.storage.base import StorageProvider, StoredFile, ensure_directory


class LocalStorageProvider(StorageProvider):
    def __init__(self, root: str = settings.upload_root) -> None:
        self.root = Path(root)
        ensure_directory(self.root)

    async def save(self, filename: str, content_type: str, content: bytes) -> StoredFile:
        safe_filename = Path(filename).name
        storage_name = f"{uuid4()}-{safe_filename}"
        target = self.root / storage_name
        target.write_bytes(content)

        return StoredFile(
            path=str(target),
            filename=safe_filename,
            content_type=content_type,
            size=len(content),
            public_url=f"{settings.public_base_url}/uploads/{quote(storage_name)}",
        )

    async def delete(self, path: str) -> None:
        target = Path(path).resolve()
        root = self.root.resolve()

        if target.parent == root and target.exists():
            target.unlink()
