import argparse
import asyncio

from app.core.settings import settings
from app.db.session import SessionLocal
from app.storage.cloudinary import CloudinaryStorageProvider
from app.storage.migration import cleanup_migrated_local_media, migrate_local_media


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Migrate local media records and files to Cloudinary.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help=(
            "Perform uploads and database updates. Without this flag, only a dry run is performed."
        ),
    )
    parser.add_argument(
        "--delete-local",
        action="store_true",
        help="Delete each local source file after its migration commits successfully.",
    )
    parser.add_argument(
        "--cleanup-local",
        action="store_true",
        help="Find local copies left behind by a completed migration.",
    )
    return parser


async def run(*, apply: bool, delete_local: bool, cleanup_local: bool) -> None:
    if delete_local and not apply:
        raise ValueError("--delete-local requires --apply.")
    if cleanup_local and delete_local:
        raise ValueError("--cleanup-local and --delete-local cannot be used together.")

    if cleanup_local:
        with SessionLocal() as db:
            cleanup_summary = cleanup_migrated_local_media(
                db,
                upload_root=settings.upload_root,
                apply=apply,
            )
        mode = "APPLY" if apply else "DRY RUN"
        print(f"Migrated local media cleanup ({mode})")
        print(f"Discovered: {cleanup_summary.discovered}")
        print(f"Eligible:   {cleanup_summary.eligible}")
        print(f"Deleted:    {cleanup_summary.deleted}")
        print(f"Missing:    {cleanup_summary.missing}")
        print(f"Ambiguous:  {cleanup_summary.ambiguous}")
        if not apply:
            print("No local files were deleted. Run again with --cleanup-local --apply.")
        return

    provider = CloudinaryStorageProvider(settings)
    with SessionLocal() as db:
        migration_summary = await migrate_local_media(
            db,
            provider,
            upload_root=settings.upload_root,
            apply=apply,
            delete_local=delete_local,
        )

    mode = "APPLY" if apply else "DRY RUN"
    print(f"Cloudinary media migration ({mode})")
    print(f"Discovered: {migration_summary.discovered}")
    print(f"Eligible:   {migration_summary.eligible}")
    print(f"Migrated:   {migration_summary.migrated}")
    print(f"Skipped:    {migration_summary.skipped}")
    print(f"Missing:    {migration_summary.missing}")
    print(f"Failed:     {migration_summary.failed}")
    if not apply:
        print("No files or database records were changed. Run again with --apply to migrate.")


def main() -> None:
    args = build_parser().parse_args()
    asyncio.run(
        run(
            apply=args.apply,
            delete_local=args.delete_local,
            cleanup_local=args.cleanup_local,
        )
    )


if __name__ == "__main__":
    main()
