from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, BaseModel

if TYPE_CHECKING:
    from app.models.media_asset import MediaAsset


class BlogCategory(BaseModel):
    __tablename__ = "blog_categories"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, index=True, nullable=False)

    posts: Mapped[list[BlogPost]] = relationship(back_populates="category")


class BlogTag(BaseModel):
    __tablename__ = "blog_tags"

    name: Mapped[str] = mapped_column(String(80), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    color: Mapped[str | None] = mapped_column(String(32), nullable=True)


class BlogPostTag(Base):
    __tablename__ = "blog_post_tags"

    blog_post_id: Mapped[UUID] = mapped_column(ForeignKey("blog_posts.id"), primary_key=True)
    blog_tag_id: Mapped[UUID] = mapped_column(ForeignKey("blog_tags.id"), primary_key=True)


class BlogPost(BaseModel):
    __tablename__ = "blog_posts"
    __table_args__ = (
        CheckConstraint("status IN ('draft', 'published', 'archived')", name="blog_posts_status"),
        CheckConstraint("reading_time_minutes >= 1", name="blog_posts_reading_time_positive"),
    )

    category_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("blog_categories.id"), index=True, nullable=True
    )
    cover_image_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("media_assets.id"), index=True, nullable=True
    )
    title: Mapped[str] = mapped_column(String(220), nullable=False)
    slug: Mapped[str] = mapped_column(String(240), unique=True, index=True, nullable=False)
    excerpt: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="draft", index=True, nullable=False)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    reading_time_minutes: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    seo_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(index=True, nullable=True)

    category: Mapped[BlogCategory | None] = relationship(back_populates="posts")
    cover_image: Mapped[MediaAsset | None] = relationship()
    tags: Mapped[list[BlogTag]] = relationship(
        secondary="blog_post_tags",
        lazy="selectin",
    )
