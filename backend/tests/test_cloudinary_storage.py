from collections.abc import Mapping

import pytest
from app.core.settings import Settings
from app.storage.cloudinary import (
    CloudinaryStorageError,
    CloudinaryStorageProvider,
)


class FakeCloudinaryUploader:
    def __init__(self) -> None:
        self.upload_options: dict[str, object] | None = None
        self.deleted_public_id: str | None = None
        self.delete_options: dict[str, object] | None = None
        self.should_fail = False
        self.response: dict[str, object] = {
            "public_id": "sandesh-portfolio/demo-123",
            "secure_url": "https://res.cloudinary.com/demo/video/upload/demo-123.mp4",
            "bytes": 14,
        }

    def upload(self, file: object, **options: object) -> Mapping[str, object]:
        if self.should_fail:
            raise RuntimeError("provider unavailable")
        self.upload_options = options
        return self.response

    def destroy(self, public_id: str, **options: object) -> Mapping[str, object]:
        self.deleted_public_id = public_id
        self.delete_options = options
        return {"result": "ok"}


@pytest.fixture()
def cloudinary_settings() -> Settings:
    return Settings(
        _env_file=None,
        storage_provider="cloudinary",
        cloudinary_cloud_name="demo",
        cloudinary_api_key="key",
        cloudinary_api_secret="secret",
        cloudinary_folder="sandesh-portfolio",
    )


@pytest.mark.asyncio
async def test_cloudinary_provider_uploads_video_and_returns_persistent_reference(
    cloudinary_settings: Settings,
) -> None:
    uploader = FakeCloudinaryUploader()
    provider = CloudinaryStorageProvider(
        cloudinary_settings,
        uploader=uploader,
        configure=lambda **_: None,
    )

    stored = await provider.save("../demo.mp4", "video/mp4", b"video-content")

    assert stored.filename == "demo.mp4"
    assert stored.path == "cloudinary|video|sandesh-portfolio/demo-123"
    assert stored.public_url.startswith("https://res.cloudinary.com/")
    assert uploader.upload_options == {
        "resource_type": "video",
        "use_filename": True,
        "unique_filename": True,
        "overwrite": False,
        "folder": "sandesh-portfolio",
    }


@pytest.mark.asyncio
async def test_cloudinary_provider_returns_image_dimensions_and_placeholder(
    cloudinary_settings: Settings,
) -> None:
    uploader = FakeCloudinaryUploader()
    uploader.response = {
        "public_id": "sandesh-portfolio/cover-123",
        "secure_url": "https://res.cloudinary.com/demo/image/upload/v1/cover-123.png",
        "bytes": 2048,
        "width": 1600,
        "height": 900,
    }
    provider = CloudinaryStorageProvider(
        cloudinary_settings,
        uploader=uploader,
        configure=lambda **_: None,
    )

    stored = await provider.save("cover.png", "image/png", b"image-content")

    assert stored.image_width == 1600
    assert stored.image_height == 900
    assert stored.placeholder_url == (
        "https://res.cloudinary.com/demo/image/upload/"
        "c_limit,w_32/e_blur:1000/f_auto/q_auto:low/v1/cover-123.png"
    )


@pytest.mark.asyncio
async def test_cloudinary_provider_deletes_using_stored_resource_type(
    cloudinary_settings: Settings,
) -> None:
    uploader = FakeCloudinaryUploader()
    provider = CloudinaryStorageProvider(
        cloudinary_settings,
        uploader=uploader,
        configure=lambda **_: None,
    )

    await provider.delete("cloudinary|video|sandesh-portfolio/demo-123")

    assert uploader.deleted_public_id == "sandesh-portfolio/demo-123"
    assert uploader.delete_options == {"resource_type": "video", "invalidate": True}


@pytest.mark.asyncio
async def test_cloudinary_provider_ignores_non_cloudinary_storage_paths(
    cloudinary_settings: Settings,
) -> None:
    uploader = FakeCloudinaryUploader()
    provider = CloudinaryStorageProvider(
        cloudinary_settings,
        uploader=uploader,
        configure=lambda **_: None,
    )

    await provider.delete("uploads/existing-local-file.png")

    assert uploader.deleted_public_id is None


@pytest.mark.asyncio
async def test_cloudinary_provider_wraps_sdk_errors(
    cloudinary_settings: Settings,
) -> None:
    uploader = FakeCloudinaryUploader()
    uploader.should_fail = True
    provider = CloudinaryStorageProvider(
        cloudinary_settings,
        uploader=uploader,
        configure=lambda **_: None,
    )

    with pytest.raises(CloudinaryStorageError):
        await provider.save("demo.mp4", "video/mp4", b"video-content")
