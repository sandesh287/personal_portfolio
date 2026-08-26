from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, BaseModel

if TYPE_CHECKING:
    from app.models.media_asset import MediaAsset


class ProjectCategory(BaseModel):
    __tablename__ = "project_categories"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    projects: Mapped[list[Project]] = relationship(back_populates="category")


class Technology(BaseModel):
    __tablename__ = "technologies"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(120), nullable=True)
    color: Mapped[str | None] = mapped_column(String(32), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class ProjectTechnology(Base):
    __tablename__ = "project_technologies"

    project_id: Mapped[UUID] = mapped_column(ForeignKey("projects.id"), primary_key=True)
    technology_id: Mapped[UUID] = mapped_column(ForeignKey("technologies.id"), primary_key=True)


class Project(BaseModel):
    __tablename__ = "projects"

    category_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("project_categories.id"),
        index=True,
        nullable=True,
    )
    cover_image_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("media_assets.id"),
        index=True,
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True, nullable=False)
    summary: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    repository_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    live_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    case_study_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="draft", index=True, nullable=False)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, index=True, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(nullable=True)

    category: Mapped[ProjectCategory | None] = relationship(back_populates="projects")
    cover_image: Mapped[MediaAsset | None] = relationship(foreign_keys=[cover_image_id])
    technologies: Mapped[list[Technology]] = relationship(
        secondary="project_technologies",
        lazy="selectin",
    )
    images: Mapped[list[ProjectImage]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    videos: Mapped[list[ProjectVideo]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ProjectImage(BaseModel):
    __tablename__ = "project_images"

    project_id: Mapped[UUID] = mapped_column(ForeignKey("projects.id"), index=True, nullable=False)
    media_asset_id: Mapped[UUID] = mapped_column(
        ForeignKey("media_assets.id"),
        index=True,
        nullable=False,
    )
    caption: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    project: Mapped[Project] = relationship(back_populates="images")
    media_asset: Mapped[MediaAsset] = relationship()

    @property
    def url(self) -> str | None:
        return self.media_asset.public_url

    @property
    def image_width(self) -> int | None:
        return self.media_asset.image_width

    @property
    def image_height(self) -> int | None:
        return self.media_asset.image_height

    @property
    def placeholder_url(self) -> str | None:
        return self.media_asset.placeholder_url


class ProjectVideo(BaseModel):
    __tablename__ = "project_videos"

    project_id: Mapped[UUID] = mapped_column(ForeignKey("projects.id"), index=True, nullable=False)
    media_asset_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("media_assets.id"),
        index=True,
        nullable=True,
    )
    provider: Mapped[str] = mapped_column(String(50), default="local", nullable=False)
    external_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str | None] = mapped_column(String(180), nullable=True)
    caption: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    project: Mapped[Project] = relationship(back_populates="videos")
    media_asset: Mapped[MediaAsset | None] = relationship()

    @property
    def url(self) -> str | None:
        if self.external_url:
            return self.external_url
        return self.media_asset.public_url if self.media_asset else None
