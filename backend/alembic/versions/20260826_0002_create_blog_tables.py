"""create blog tables

Revision ID: 20260826_0002
Revises: 20260826_0001
Create Date: 2026-08-26
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260826_0002"
down_revision: str | None = "20260826_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def base_columns() -> list[sa.Column]:
    return [
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by_id", postgresql.UUID(as_uuid=True), nullable=True),
    ]


def audit_constraints(table_name: str) -> list[sa.ForeignKeyConstraint]:
    return [
        sa.ForeignKeyConstraint(
            ["created_by_id"], ["users.id"], name=f"fk_{table_name}_created_by_id_users"
        ),
        sa.ForeignKeyConstraint(
            ["updated_by_id"], ["users.id"], name=f"fk_{table_name}_updated_by_id_users"
        ),
    ]


def upgrade() -> None:
    op.create_table(
        "blog_categories",
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=140), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        *base_columns(),
        *audit_constraints("blog_categories"),
        sa.PrimaryKeyConstraint("id", name="pk_blog_categories"),
        sa.UniqueConstraint("slug", name="uq_blog_categories_slug"),
    )
    op.create_index("ix_blog_categories_deleted_at", "blog_categories", ["deleted_at"])
    op.create_index("ix_blog_categories_slug", "blog_categories", ["slug"])
    op.create_index("ix_blog_categories_sort_order", "blog_categories", ["sort_order"])

    op.create_table(
        "blog_tags",
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("color", sa.String(length=32), nullable=True),
        *base_columns(),
        *audit_constraints("blog_tags"),
        sa.PrimaryKeyConstraint("id", name="pk_blog_tags"),
        sa.UniqueConstraint("slug", name="uq_blog_tags_slug"),
    )
    op.create_index("ix_blog_tags_deleted_at", "blog_tags", ["deleted_at"])
    op.create_index("ix_blog_tags_slug", "blog_tags", ["slug"])

    op.create_table(
        "blog_posts",
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("cover_image_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=220), nullable=False),
        sa.Column("slug", sa.String(length=240), nullable=False),
        sa.Column("excerpt", sa.String(length=500), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("featured", sa.Boolean(), nullable=False),
        sa.Column("reading_time_minutes", sa.Integer(), nullable=False),
        sa.Column("seo_title", sa.String(length=255), nullable=True),
        sa.Column("seo_description", sa.String(length=500), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        *base_columns(),
        *audit_constraints("blog_posts"),
        sa.CheckConstraint(
            "status IN ('draft', 'published', 'archived')", name="ck_blog_posts_status"
        ),
        sa.CheckConstraint("reading_time_minutes >= 1", name="ck_blog_posts_reading_time_positive"),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["blog_categories.id"],
            name="fk_blog_posts_category_id_blog_categories",
        ),
        sa.ForeignKeyConstraint(
            ["cover_image_id"],
            ["media_assets.id"],
            name="fk_blog_posts_cover_image_id_media_assets",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_blog_posts"),
        sa.UniqueConstraint("slug", name="uq_blog_posts_slug"),
    )
    op.create_index("ix_blog_posts_category_id", "blog_posts", ["category_id"])
    op.create_index("ix_blog_posts_cover_image_id", "blog_posts", ["cover_image_id"])
    op.create_index("ix_blog_posts_deleted_at", "blog_posts", ["deleted_at"])
    op.create_index("ix_blog_posts_featured", "blog_posts", ["featured"])
    op.create_index("ix_blog_posts_published_at", "blog_posts", ["published_at"])
    op.create_index("ix_blog_posts_slug", "blog_posts", ["slug"])
    op.create_index("ix_blog_posts_status", "blog_posts", ["status"])

    op.create_table(
        "blog_post_tags",
        sa.Column("blog_post_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("blog_tag_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["blog_post_id"], ["blog_posts.id"], name="fk_blog_post_tags_blog_post_id_blog_posts"
        ),
        sa.ForeignKeyConstraint(
            ["blog_tag_id"], ["blog_tags.id"], name="fk_blog_post_tags_blog_tag_id_blog_tags"
        ),
        sa.PrimaryKeyConstraint("blog_post_id", "blog_tag_id", name="pk_blog_post_tags"),
    )
    op.create_index("ix_blog_post_tags_blog_tag_id", "blog_post_tags", ["blog_tag_id"])


def downgrade() -> None:
    op.drop_index("ix_blog_post_tags_blog_tag_id", table_name="blog_post_tags")
    op.drop_table("blog_post_tags")

    op.drop_index("ix_blog_posts_status", table_name="blog_posts")
    op.drop_index("ix_blog_posts_slug", table_name="blog_posts")
    op.drop_index("ix_blog_posts_published_at", table_name="blog_posts")
    op.drop_index("ix_blog_posts_featured", table_name="blog_posts")
    op.drop_index("ix_blog_posts_deleted_at", table_name="blog_posts")
    op.drop_index("ix_blog_posts_cover_image_id", table_name="blog_posts")
    op.drop_index("ix_blog_posts_category_id", table_name="blog_posts")
    op.drop_table("blog_posts")

    op.drop_index("ix_blog_tags_slug", table_name="blog_tags")
    op.drop_index("ix_blog_tags_deleted_at", table_name="blog_tags")
    op.drop_table("blog_tags")

    op.drop_index("ix_blog_categories_sort_order", table_name="blog_categories")
    op.drop_index("ix_blog_categories_slug", table_name="blog_categories")
    op.drop_index("ix_blog_categories_deleted_at", table_name="blog_categories")
    op.drop_table("blog_categories")
