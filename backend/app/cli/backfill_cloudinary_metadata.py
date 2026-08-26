import argparse
import asyncio

from app.core.settings import settings
from app.db.session import SessionLocal
from app.storage.cloudinary import CloudinaryStorageProvider
from app.storage.migration import backfill_cloudinary_image_metadata


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Backfill dimensions and placeholders for existing Cloudinary images.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Persist metadata updates. Without this flag, only a dry run is performed.",
    )
    return parser


async def run(*, apply: bool) -> None:
    provider = CloudinaryStorageProvider(settings)
    with SessionLocal() as db:
        summary = await backfill_cloudinary_image_metadata(db, provider, apply=apply)

    mode = "APPLY" if apply else "DRY RUN"
    print(f"Cloudinary image metadata backfill ({mode})")
    print(f"Discovered: {summary.discovered}")
    print(f"Eligible:   {summary.eligible}")
    print(f"Updated:    {summary.updated}")
    print(f"Skipped:    {summary.skipped}")
    print(f"Failed:     {summary.failed}")
    if not apply:
        print("No database records were changed. Run again with --apply to backfill metadata.")


def main() -> None:
    args = build_parser().parse_args()
    asyncio.run(run(apply=args.apply))


if __name__ == "__main__":
    main()
