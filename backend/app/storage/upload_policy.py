from enum import StrEnum

from app.core.exceptions import ApiError
from app.core.settings import Settings, settings

BYTES_PER_MEBIBYTE = 1024 * 1024


class UploadKind(StrEnum):
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"


def classify_upload(content_type: str) -> UploadKind:
    normalized_content_type = content_type.lower().split(";", maxsplit=1)[0].strip()
    if normalized_content_type.startswith("image/"):
        return UploadKind.IMAGE
    if normalized_content_type.startswith("video/"):
        return UploadKind.VIDEO
    if normalized_content_type == "application/pdf":
        return UploadKind.DOCUMENT
    raise ApiError(
        status_code=422,
        message="Only image, video, and PDF files are supported.",
        code="unsupported_media_type",
    )


def get_upload_limit_bytes(content_type: str, config: Settings = settings) -> int:
    upload_kind = classify_upload(content_type)
    limits_mb = {
        UploadKind.IMAGE: config.max_image_upload_size_mb,
        UploadKind.VIDEO: config.max_video_upload_size_mb,
        UploadKind.DOCUMENT: config.max_document_upload_size_mb,
    }
    return limits_mb[upload_kind] * BYTES_PER_MEBIBYTE


def validate_upload_size(
    content_type: str,
    size_bytes: int,
    config: Settings = settings,
) -> None:
    max_size_bytes = get_upload_limit_bytes(content_type, config)
    if size_bytes <= max_size_bytes:
        return

    max_size_mb = max_size_bytes // BYTES_PER_MEBIBYTE
    raise ApiError(
        status_code=413,
        message=f"Uploaded file exceeds the {max_size_mb} MiB limit for this file type.",
        code="upload_too_large",
    )
