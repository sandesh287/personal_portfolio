import asyncio
from collections.abc import Callable, Mapping
from io import BytesIO
from pathlib import Path
from typing import Protocol, cast

import cloudinary
import cloudinary.api
import cloudinary.uploader
from app.core.settings import Settings, settings
from app.storage.base import StorageProvider, StoredFile, StoredImageMetadata
from app.storage.upload_policy import UploadKind, classify_upload

CLOUDINARY_PATH_PREFIX = "cloudinary"


class _NamedBytesIO(BytesIO):
    def __init__(self, content: bytes, name: str) -> None:
        super().__init__(content)
        self.name = name


class CloudinaryUploader(Protocol):
    def upload(self, file: object, **options: object) -> Mapping[str, object]: ...

    def destroy(self, public_id: str, **options: object) -> Mapping[str, object]: ...


class CloudinaryResourceApi(Protocol):
    def resource(self, public_id: str, **options: object) -> Mapping[str, object]: ...


class CloudinaryStorageError(RuntimeError):
    pass


class CloudinaryStorageProvider(StorageProvider):
    def __init__(
        self,
        config: Settings = settings,
        *,
        uploader: CloudinaryUploader | None = None,
        resource_api: CloudinaryResourceApi | None = None,
        configure: Callable[..., object] | None = None,
    ) -> None:
        if not config.cloudinary_cloud_name or not config.cloudinary_api_key:
            raise ValueError("Cloudinary cloud name and API key are required.")
        if not config.cloudinary_api_secret:
            raise ValueError("Cloudinary API secret is required.")

        configure_cloudinary = configure or cloudinary.config
        configure_cloudinary(
            cloud_name=config.cloudinary_cloud_name,
            api_key=config.cloudinary_api_key,
            api_secret=config.cloudinary_api_secret,
            secure=True,
        )
        self.folder = config.cloudinary_folder.strip("/")
        self.uploader = uploader or cast(CloudinaryUploader, cloudinary.uploader)
        self.resource_api = resource_api or cast(CloudinaryResourceApi, cloudinary.api)

    async def save(self, filename: str, content_type: str, content: bytes) -> StoredFile:
        safe_filename = Path(filename).name
        resource_type = _get_cloudinary_resource_type(content_type)
        source = _NamedBytesIO(content, safe_filename)

        options: dict[str, object] = {
            "resource_type": resource_type,
            "use_filename": True,
            "unique_filename": True,
            "overwrite": False,
        }
        if self.folder:
            options["folder"] = self.folder

        try:
            response = await asyncio.to_thread(self.uploader.upload, source, **options)
            public_id = _required_string(response, "public_id")
            public_url = _required_string(response, "secure_url")
        except Exception as exc:
            raise CloudinaryStorageError("Cloudinary upload failed.") from exc

        return StoredFile(
            path=_build_storage_path(resource_type, public_id),
            filename=safe_filename,
            content_type=content_type,
            size=_optional_int(response, "bytes", len(content)),
            public_url=public_url,
            image_width=_optional_positive_int(response, "width"),
            image_height=_optional_positive_int(response, "height"),
            placeholder_url=(
                _build_image_placeholder_url(public_url) if resource_type == "image" else None
            ),
        )

    async def delete(self, path: str) -> None:
        storage_reference = _parse_storage_path(path)
        if storage_reference is None:
            return

        resource_type, public_id = storage_reference
        try:
            await asyncio.to_thread(
                self.uploader.destroy,
                public_id,
                resource_type=resource_type,
                invalidate=True,
            )
        except Exception as exc:
            raise CloudinaryStorageError("Cloudinary deletion failed.") from exc

    async def get_image_metadata(self, path: str) -> StoredImageMetadata | None:
        storage_reference = _parse_storage_path(path)
        if storage_reference is None or storage_reference[0] != "image":
            return None

        _, public_id = storage_reference
        try:
            response = await asyncio.to_thread(
                self.resource_api.resource,
                public_id,
                resource_type="image",
            )
            width = _required_positive_int(response, "width")
            height = _required_positive_int(response, "height")
            public_url = _required_string(response, "secure_url")
        except Exception as exc:
            raise CloudinaryStorageError("Cloudinary metadata lookup failed.") from exc

        return StoredImageMetadata(
            width=width,
            height=height,
            placeholder_url=_build_image_placeholder_url(public_url),
        )


def _get_cloudinary_resource_type(content_type: str) -> str:
    upload_kind = classify_upload(content_type)
    if upload_kind is UploadKind.VIDEO:
        return "video"
    # Cloudinary treats PDFs as image assets, enabling inline delivery and page previews.
    # Password-protected PDFs are intentionally unsupported by the resume upload flow.
    return "image"


def _build_storage_path(resource_type: str, public_id: str) -> str:
    return f"{CLOUDINARY_PATH_PREFIX}|{resource_type}|{public_id}"


def _parse_storage_path(path: str) -> tuple[str, str] | None:
    parts = path.split("|", maxsplit=2)
    if len(parts) != 3 or parts[0] != CLOUDINARY_PATH_PREFIX:
        return None
    return parts[1], parts[2]


def _required_string(response: Mapping[str, object], key: str) -> str:
    value = response.get(key)
    if not isinstance(value, str) or not value:
        raise CloudinaryStorageError(f"Cloudinary response is missing {key}.")
    return value


def _optional_int(response: Mapping[str, object], key: str, default: int) -> int:
    value = response.get(key)
    return value if isinstance(value, int) else default


def _optional_positive_int(response: Mapping[str, object], key: str) -> int | None:
    value = response.get(key)
    return value if isinstance(value, int) and value > 0 else None


def _required_positive_int(response: Mapping[str, object], key: str) -> int:
    value = _optional_positive_int(response, key)
    if value is None:
        raise CloudinaryStorageError(f"Cloudinary response is missing {key}.")
    return value


def _build_image_placeholder_url(public_url: str) -> str:
    upload_path = "/image/upload/"
    if upload_path not in public_url:
        return public_url
    return public_url.replace(
        upload_path,
        f"{upload_path}c_limit,w_32/e_blur:1000/f_auto/q_auto:low/",
        1,
    )
