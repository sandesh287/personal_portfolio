from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import BaseModel
from app.models.media_asset import MediaAsset


class ResumeVersion(BaseModel):
    __tablename__ = "resume_versions"
    __table_args__ = (
        Index(
            "uq_resume_versions_one_active",
            "is_active",
            unique=True,
            postgresql_where=text("is_active = true AND deleted_at IS NULL"),
            sqlite_where=text("is_active = 1 AND deleted_at IS NULL"),
        ),
    )

    media_asset_id: Mapped[UUID] = mapped_column(
        ForeignKey("media_assets.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    version: Mapped[str] = mapped_column(String(40), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    download_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    media_asset: Mapped[MediaAsset] = relationship(lazy="joined")
