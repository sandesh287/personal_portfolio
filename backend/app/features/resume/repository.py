from collections.abc import Sequence
from uuid import UUID

from app.models.resume import ResumeVersion
from app.repositories.base import BaseRepository
from sqlalchemy import select, update
from sqlalchemy.orm import Session


class ResumeRepository(BaseRepository[ResumeVersion]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, ResumeVersion)

    def get_active(self) -> ResumeVersion | None:
        return self.db.scalar(self.base_query().where(ResumeVersion.is_active.is_(True)).limit(1))

    def get_version(self, version_id: UUID) -> ResumeVersion | None:
        return self.db.scalar(self.base_query().where(ResumeVersion.id == version_id))

    def list_versions(self) -> Sequence[ResumeVersion]:
        return (
            self.db.scalars(
                self.base_query().order_by(
                    ResumeVersion.is_active.desc(), ResumeVersion.created_at.desc()
                )
            )
            .unique()
            .all()
        )

    def deactivate_all(self, *, exclude_id: UUID | None = None) -> None:
        statement = update(ResumeVersion).where(
            ResumeVersion.deleted_at.is_(None), ResumeVersion.is_active.is_(True)
        )
        if exclude_id is not None:
            statement = statement.where(ResumeVersion.id != exclude_id)
        self.db.execute(statement.values(is_active=False))

    def media_is_referenced(self, media_id: UUID) -> bool:
        return (
            self.db.scalar(
                select(ResumeVersion.id)
                .where(
                    ResumeVersion.media_asset_id == media_id,
                    ResumeVersion.deleted_at.is_(None),
                )
                .limit(1)
            )
            is not None
        )
