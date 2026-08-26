import logging
from collections import defaultdict
from dataclasses import dataclass, replace
from hashlib import file_digest
from pathlib import Path
from uuid import UUID

from app.models.media_asset import MediaAsset
from app.storage.base import StorageProvider
from app.storage.cloudinary import CLOUDINARY_PATH_PREFIX
from app.storage.upload_policy import validate_upload_size
from sqlalchemy import select
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class MediaMigrationSummary:
    discovered: int = 0
    eligible: int = 0
    migrated: int = 0
    skipped: int = 0
    missing: int = 0
    failed: int = 0


@dataclass(frozen=True)
class LocalMediaCleanupSummary:
    discovered: int = 0
    eligible: int = 0
    deleted: int = 0
    missing: int = 0
    ambiguous: int = 0


async def migrate_local_media(
    db: Session,
    target_storage: StorageProvider,
    *,
    upload_root: str,
    apply: bool,
    delete_local: bool = False,
) -> MediaMigrationSummary:
    assets = db.scalars(
        select(MediaAsset)
        .where(MediaAsset.deleted_at.is_(None))
        .order_by(MediaAsset.created_at.asc(), MediaAsset.id.asc())
    ).all()
    root = Path(upload_root).resolve()
    summary = MediaMigrationSummary(discovered=len(assets))

    for asset in assets:
        if asset.storage_path.startswith(f"{CLOUDINARY_PATH_PREFIX}|"):
            summary = replace(summary, skipped=summary.skipped + 1)
            continue

        source = Path(asset.storage_path).resolve()
        if source.parent != root or not source.is_file():
            summary = replace(summary, missing=summary.missing + 1)
            logger.warning(
                "Skipping media asset with missing or invalid local file",
                extra={"media_id": str(asset.id), "storage_path": asset.storage_path},
            )
            continue

        summary = replace(summary, eligible=summary.eligible + 1)
        if not apply:
            continue

        try:
            content = source.read_bytes()
            validate_upload_size(asset.content_type, len(content))
            stored = await target_storage.save(
                asset.original_filename,
                asset.content_type,
                content,
            )
        except Exception:
            summary = replace(summary, failed=summary.failed + 1)
            logger.exception("Unable to upload media asset", extra={"media_id": str(asset.id)})
            continue

        previous_values = (
            asset.storage_path,
            asset.filename,
            asset.public_url,
            asset.size_bytes,
            asset.image_width,
            asset.image_height,
            asset.placeholder_url,
        )
        asset.storage_path = stored.path
        asset.filename = stored.filename
        asset.public_url = stored.public_url
        asset.size_bytes = stored.size
        asset.image_width = stored.image_width
        asset.image_height = stored.image_height
        asset.placeholder_url = stored.placeholder_url
        try:
            db.commit()
        except Exception:
            db.rollback()
            (
                asset.storage_path,
                asset.filename,
                asset.public_url,
                asset.size_bytes,
                asset.image_width,
                asset.image_height,
                asset.placeholder_url,
            ) = previous_values
            await target_storage.delete(stored.path)
            summary = replace(summary, failed=summary.failed + 1)
            logger.exception(
                "Unable to update migrated media record",
                extra={"media_id": str(asset.id)},
            )
            continue

        summary = replace(summary, migrated=summary.migrated + 1)
        if delete_local:
            try:
                source.unlink()
            except OSError:
                logger.exception(
                    "Migrated media but could not delete local source",
                    extra={"media_id": str(asset.id), "storage_path": str(source)},
                )

    return summary


def cleanup_migrated_local_media(
    db: Session,
    *,
    upload_root: str,
    apply: bool,
) -> LocalMediaCleanupSummary:
    assets = db.scalars(
        select(MediaAsset)
        .where(
            MediaAsset.deleted_at.is_(None),
            MediaAsset.storage_path.startswith(f"{CLOUDINARY_PATH_PREFIX}|"),
        )
        .order_by(MediaAsset.created_at.asc(), MediaAsset.id.asc())
    ).all()
    root = Path(upload_root).resolve()
    local_files = [path for path in root.iterdir() if path.is_file()] if root.is_dir() else []
    assets_by_signature: dict[tuple[str, int], list[MediaAsset]] = defaultdict(list)
    for asset in assets:
        signature = (Path(asset.filename).name, asset.size_bytes)
        assets_by_signature[signature].append(asset)

    summary = LocalMediaCleanupSummary(discovered=len(assets))

    for (filename, size_bytes), matching_assets in assets_by_signature.items():
        candidates = [
            path for path in local_files if _is_local_storage_copy(path, filename, size_bytes)
        ]
        asset_count = len(matching_assets)
        if not candidates:
            summary = replace(summary, missing=summary.missing + asset_count)
            continue
        candidates_are_identical = _files_have_same_digest(candidates)
        if len(candidates) != asset_count and not candidates_are_identical:
            summary = replace(summary, ambiguous=summary.ambiguous + asset_count)
            logger.warning(
                "Skipping ambiguous migrated media cleanup",
                extra={
                    "media_filename": filename,
                    "asset_count": asset_count,
                    "candidate_count": len(candidates),
                },
            )
            continue

        summary = replace(summary, eligible=summary.eligible + len(candidates))
        if not apply:
            continue

        for candidate in candidates:
            try:
                candidate.unlink()
                summary = replace(summary, deleted=summary.deleted + 1)
            except OSError:
                logger.exception(
                    "Unable to delete migrated local media copy",
                    extra={"storage_path": str(candidate)},
                )

    return summary


def _is_local_storage_copy(path: Path, filename: str, size_bytes: int) -> bool:
    if len(path.name) <= 37 or path.name[36] != "-":
        return False
    prefix = path.name[:36]
    stored_filename = path.name[37:]
    if stored_filename != filename or path.stat().st_size != size_bytes:
        return False
    try:
        UUID(prefix)
    except ValueError:
        return False
    return True


def _files_have_same_digest(paths: list[Path]) -> bool:
    if len(paths) < 2:
        return True

    digests: set[str] = set()
    for path in paths:
        with path.open("rb") as source:
            digests.add(file_digest(source, "sha256").hexdigest())
        if len(digests) > 1:
            return False
    return True
