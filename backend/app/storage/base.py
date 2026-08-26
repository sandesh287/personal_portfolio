from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class StoredFile:
    path: str
    filename: str
    content_type: str
    size: int
    public_url: str | None = None
    image_width: int | None = None
    image_height: int | None = None
    placeholder_url: str | None = None


@dataclass(frozen=True)
class StoredImageMetadata:
    width: int
    height: int
    placeholder_url: str


class StorageProvider(ABC):
    @abstractmethod
    async def save(self, filename: str, content_type: str, content: bytes) -> StoredFile:
        raise NotImplementedError

    @abstractmethod
    async def delete(self, path: str) -> None:
        raise NotImplementedError


def ensure_directory(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)
