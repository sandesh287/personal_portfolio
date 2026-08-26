from collections.abc import Sequence
from uuid import UUID

from app.models.blog import BlogPost
from app.models.media_asset import MediaAsset
from app.models.project import Project, ProjectImage, ProjectVideo
from app.repositories.base import BaseRepository
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session


class MediaRepository(BaseRepository[MediaAsset]):
    SORT_COLUMNS = {
        "created_at": MediaAsset.created_at,
        "original_filename": MediaAsset.original_filename,
        "size_bytes": MediaAsset.size_bytes,
    }

    def __init__(self, db: Session) -> None:
        super().__init__(db, MediaAsset)

    def list_filtered(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None,
        content_type: str | None,
        folder: str | None,
        sort: str,
        order: str,
    ) -> tuple[Sequence[MediaAsset], int]:
        statement = self.base_query()

        if search:
            pattern = f"%{search}%"
            statement = statement.where(
                or_(
                    MediaAsset.original_filename.ilike(pattern),
                    MediaAsset.alt_text.ilike(pattern),
                )
            )
        if content_type:
            statement = statement.where(MediaAsset.content_type.like(f"{content_type}%"))
        if folder:
            statement = statement.where(MediaAsset.folder == folder)

        total = self.db.scalar(select(func.count()).select_from(statement.subquery())) or 0
        sort_column = self.SORT_COLUMNS[sort]
        ordering = sort_column.asc() if order == "asc" else sort_column.desc()
        items = self.db.scalars(
            statement.order_by(ordering, MediaAsset.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return items, total

    def is_referenced(self, media_id: UUID) -> bool:
        checks = (
            select(Project.id).where(
                Project.cover_image_id == media_id,
                Project.deleted_at.is_(None),
            ),
            select(ProjectImage.id).where(
                ProjectImage.media_asset_id == media_id,
                ProjectImage.deleted_at.is_(None),
            ),
            select(ProjectVideo.id).where(
                ProjectVideo.media_asset_id == media_id,
                ProjectVideo.deleted_at.is_(None),
            ),
            select(BlogPost.id).where(
                BlogPost.cover_image_id == media_id,
                BlogPost.deleted_at.is_(None),
            ),
        )
        return any(self.db.scalar(statement.limit(1)) is not None for statement in checks)
