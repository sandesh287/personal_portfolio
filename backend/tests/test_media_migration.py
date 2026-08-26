from pathlib import Path
from uuid import uuid4

import pytest
from app.models.media_asset import MediaAsset
from app.storage.base import StorageProvider, StoredFile, StoredImageMetadata
from app.storage.migration import (
    backfill_cloudinary_image_metadata,
    cleanup_migrated_local_media,
    migrate_local_media,
)
from sqlalchemy.orm import Session


class MigrationTargetStorage(StorageProvider):
    def __init__(self) -> None:
        self.saved_files: list[str] = []

    async def save(self, filename: str, content_type: str, content: bytes) -> StoredFile:
        self.saved_files.append(filename)
        return StoredFile(
            path=f"cloudinary|image|sandesh-portfolio/{filename}",
            filename=filename,
            content_type=content_type,
            size=len(content),
            public_url=f"https://res.cloudinary.com/demo/image/upload/{filename}",
            image_width=1280,
            image_height=720,
            placeholder_url=f"https://res.cloudinary.com/demo/image/upload/w_32/{filename}",
        )

    async def delete(self, path: str) -> None:
        return None


class MetadataReader:
    def __init__(self) -> None:
        self.requested_paths: list[str] = []

    async def get_image_metadata(self, path: str) -> StoredImageMetadata | None:
        self.requested_paths.append(path)
        return StoredImageMetadata(
            width=1920,
            height=1080,
            placeholder_url="https://res.cloudinary.com/demo/image/upload/w_32/preview.png",
        )


def create_local_asset(db: Session, source: Path) -> MediaAsset:
    asset = MediaAsset(
        filename=source.name,
        original_filename=source.name,
        storage_path=str(source),
        public_url=f"http://127.0.0.1:8000/uploads/{source.name}",
        content_type="image/png",
        size_bytes=source.stat().st_size,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


def create_cloudinary_asset(db: Session, *, with_metadata: bool = False) -> MediaAsset:
    asset = MediaAsset(
        filename="preview.png",
        original_filename="preview.png",
        storage_path="cloudinary|image|sandesh-portfolio/preview",
        public_url="https://res.cloudinary.com/demo/image/upload/preview.png",
        content_type="image/png",
        size_bytes=100,
        image_width=1280 if with_metadata else None,
        image_height=720 if with_metadata else None,
        placeholder_url="https://example.com/placeholder.png" if with_metadata else None,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@pytest.mark.asyncio
async def test_cloudinary_metadata_backfill_is_dry_run_and_idempotent(
    db_session: Session,
) -> None:
    incomplete = create_cloudinary_asset(db_session)
    create_cloudinary_asset(db_session, with_metadata=True)
    reader = MetadataReader()

    dry_run = await backfill_cloudinary_image_metadata(db_session, reader, apply=False)
    applied = await backfill_cloudinary_image_metadata(db_session, reader, apply=True)
    repeated = await backfill_cloudinary_image_metadata(db_session, reader, apply=True)

    db_session.refresh(incomplete)
    assert dry_run.eligible == 1
    assert dry_run.updated == 0
    assert applied.updated == 1
    assert applied.skipped == 1
    assert repeated.updated == 0
    assert repeated.skipped == 2
    assert reader.requested_paths == ["cloudinary|image|sandesh-portfolio/preview"]
    assert incomplete.image_width == 1920
    assert incomplete.image_height == 1080


@pytest.mark.asyncio
async def test_media_migration_dry_run_does_not_change_asset(
    db_session: Session,
    tmp_path: Path,
) -> None:
    source = tmp_path / "preview.png"
    source.write_bytes(b"image-content")
    asset = create_local_asset(db_session, source)
    storage = MigrationTargetStorage()

    summary = await migrate_local_media(
        db_session,
        storage,
        upload_root=str(tmp_path),
        apply=False,
    )

    assert summary.discovered == 1
    assert summary.eligible == 1
    assert summary.migrated == 0
    assert storage.saved_files == []
    assert asset.storage_path == str(source)


@pytest.mark.asyncio
async def test_media_migration_updates_record_and_preserves_local_file(
    db_session: Session,
    tmp_path: Path,
) -> None:
    source = tmp_path / "preview.png"
    source.write_bytes(b"image-content")
    asset = create_local_asset(db_session, source)
    storage = MigrationTargetStorage()

    summary = await migrate_local_media(
        db_session,
        storage,
        upload_root=str(tmp_path),
        apply=True,
    )

    db_session.refresh(asset)
    assert summary.migrated == 1
    assert asset.storage_path == "cloudinary|image|sandesh-portfolio/preview.png"
    assert asset.public_url == "https://res.cloudinary.com/demo/image/upload/preview.png"
    assert asset.image_width == 1280
    assert asset.image_height == 720
    assert asset.placeholder_url == (
        "https://res.cloudinary.com/demo/image/upload/w_32/preview.png"
    )
    assert source.exists()


@pytest.mark.asyncio
async def test_media_migration_is_idempotent_and_can_delete_local_source(
    db_session: Session,
    tmp_path: Path,
) -> None:
    source = tmp_path / "preview.png"
    source.write_bytes(b"image-content")
    create_local_asset(db_session, source)
    storage = MigrationTargetStorage()

    first_summary = await migrate_local_media(
        db_session,
        storage,
        upload_root=str(tmp_path),
        apply=True,
        delete_local=True,
    )
    second_summary = await migrate_local_media(
        db_session,
        storage,
        upload_root=str(tmp_path),
        apply=True,
        delete_local=True,
    )

    assert first_summary.migrated == 1
    assert second_summary.skipped == 1
    assert len(storage.saved_files) == 1
    assert not source.exists()


@pytest.mark.asyncio
async def test_media_migration_reports_missing_file(
    db_session: Session,
    tmp_path: Path,
) -> None:
    missing = tmp_path / "missing.png"
    db_session.add(
        MediaAsset(
            filename=missing.name,
            original_filename=missing.name,
            storage_path=str(missing),
            public_url=None,
            content_type="image/png",
            size_bytes=10,
        )
    )
    db_session.commit()

    summary = await migrate_local_media(
        db_session,
        MigrationTargetStorage(),
        upload_root=str(tmp_path),
        apply=True,
    )

    assert summary.missing == 1
    assert summary.migrated == 0


def test_migrated_local_cleanup_is_dry_run_by_default(
    db_session: Session,
    tmp_path: Path,
) -> None:
    source = tmp_path / f"{uuid4()}-preview.png"
    source.write_bytes(b"image-content")
    asset = create_local_asset(db_session, source)
    asset.filename = "preview.png"
    asset.storage_path = "cloudinary|image|sandesh-portfolio/preview"
    asset.public_url = "https://res.cloudinary.com/demo/image/upload/preview.png"
    db_session.commit()

    summary = cleanup_migrated_local_media(
        db_session,
        upload_root=str(tmp_path),
        apply=False,
    )

    assert summary.discovered == 1
    assert summary.eligible == 1
    assert summary.deleted == 0
    assert source.exists()


def test_migrated_local_cleanup_deletes_unique_filename_and_size_match(
    db_session: Session,
    tmp_path: Path,
) -> None:
    source = tmp_path / f"{uuid4()}-preview.png"
    source.write_bytes(b"image-content")
    asset = create_local_asset(db_session, source)
    asset.filename = "preview.png"
    asset.storage_path = "cloudinary|image|sandesh-portfolio/preview"
    asset.public_url = "https://res.cloudinary.com/demo/image/upload/preview.png"
    db_session.commit()

    summary = cleanup_migrated_local_media(
        db_session,
        upload_root=str(tmp_path),
        apply=True,
    )

    assert summary.deleted == 1
    assert not source.exists()


def test_migrated_local_cleanup_skips_ambiguous_matches(
    db_session: Session,
    tmp_path: Path,
) -> None:
    first = tmp_path / f"{uuid4()}-preview.png"
    second = tmp_path / f"{uuid4()}-preview.png"
    first.write_bytes(b"content-a")
    second.write_bytes(b"content-b")
    asset = create_local_asset(db_session, first)
    asset.filename = "preview.png"
    asset.storage_path = "cloudinary|image|sandesh-portfolio/preview"
    asset.public_url = "https://res.cloudinary.com/demo/image/upload/preview.png"
    db_session.commit()

    summary = cleanup_migrated_local_media(
        db_session,
        upload_root=str(tmp_path),
        apply=True,
    )

    assert summary.ambiguous == 1
    assert summary.deleted == 0
    assert first.exists()
    assert second.exists()


def test_migrated_local_cleanup_removes_identical_orphan_copies(
    db_session: Session,
    tmp_path: Path,
) -> None:
    copies = [tmp_path / f"{uuid4()}-preview.png" for _ in range(3)]
    for copy in copies:
        copy.write_bytes(b"identical-content")
    asset = create_local_asset(db_session, copies[0])
    asset.filename = "preview.png"
    asset.storage_path = "cloudinary|image|sandesh-portfolio/preview"
    asset.public_url = "https://res.cloudinary.com/demo/image/upload/preview.png"
    db_session.commit()

    summary = cleanup_migrated_local_media(
        db_session,
        upload_root=str(tmp_path),
        apply=True,
    )

    assert summary.eligible == 3
    assert summary.deleted == 3
    assert summary.ambiguous == 0
    assert not any(copy.exists() for copy in copies)


def test_migrated_local_cleanup_reconciles_equal_duplicate_groups(
    db_session: Session,
    tmp_path: Path,
) -> None:
    first = tmp_path / f"{uuid4()}-preview.png"
    second = tmp_path / f"{uuid4()}-preview.png"
    first.write_bytes(b"same-size")
    second.write_bytes(b"same-size")
    first_asset = create_local_asset(db_session, first)
    second_asset = create_local_asset(db_session, second)
    for index, asset in enumerate((first_asset, second_asset), start=1):
        asset.filename = "preview.png"
        asset.storage_path = f"cloudinary|image|sandesh-portfolio/preview-{index}"
        asset.public_url = f"https://res.cloudinary.com/demo/image/upload/preview-{index}.png"
    db_session.commit()

    summary = cleanup_migrated_local_media(
        db_session,
        upload_root=str(tmp_path),
        apply=True,
    )

    assert summary.eligible == 2
    assert summary.deleted == 2
    assert summary.ambiguous == 0
    assert not first.exists()
    assert not second.exists()
