import pytest
from app.core.exceptions import ApiError
from app.core.settings import Settings
from app.storage.upload_policy import (
    BYTES_PER_MEBIBYTE,
    get_upload_limit_bytes,
    validate_upload_size,
)


@pytest.fixture()
def upload_settings() -> Settings:
    return Settings(
        _env_file=None,
        max_image_upload_size_mb=2,
        max_video_upload_size_mb=8,
        max_document_upload_size_mb=4,
    )


@pytest.mark.parametrize(
    ("content_type", "expected_mebibytes"),
    [("image/png", 2), ("video/mp4", 8), ("application/pdf", 4)],
)
def test_upload_limits_are_selected_by_content_type(
    content_type: str,
    expected_mebibytes: int,
    upload_settings: Settings,
) -> None:
    assert get_upload_limit_bytes(content_type, upload_settings) == (
        expected_mebibytes * BYTES_PER_MEBIBYTE
    )


def test_upload_size_allows_file_at_configured_limit(upload_settings: Settings) -> None:
    validate_upload_size("video/mp4", 8 * BYTES_PER_MEBIBYTE, upload_settings)


def test_upload_size_error_reports_type_specific_limit(upload_settings: Settings) -> None:
    with pytest.raises(ApiError) as exc_info:
        validate_upload_size("video/mp4", 8 * BYTES_PER_MEBIBYTE + 1, upload_settings)

    assert exc_info.value.status_code == 413
    assert exc_info.value.code == "upload_too_large"
    assert "8 MiB" in exc_info.value.message


def test_upload_policy_rejects_unsupported_content_type(upload_settings: Settings) -> None:
    with pytest.raises(ApiError) as exc_info:
        get_upload_limit_bytes("application/octet-stream", upload_settings)

    assert exc_info.value.status_code == 422
    assert exc_info.value.code == "unsupported_media_type"
