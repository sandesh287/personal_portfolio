"""create project tables

Revision ID: 20260804_0002
Revises: 20260804_0001
Create Date: 2026-08-04
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260804_0002"
down_revision: str | None = "20260804_0001"
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
            ["created_by_id"],
            ["users.id"],
            name=f"fk_{table_name}_created_by_id_users",
        ),
        sa.ForeignKeyConstraint(
            ["updated_by_id"],
            ["users.id"],
            name=f"fk_{table_name}_updated_by_id_users",
        ),
    ]


def upgrade() -> None:
    op.create_table(
        "media_assets",
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("storage_path", sa.Text(), nullable=False),
        sa.Column("public_url", sa.Text(), nullable=True),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("alt_text", sa.String(length=255), nullable=True),
        *base_columns(),
        *audit_constraints("media_assets"),
        sa.PrimaryKeyConstraint("id", name="pk_media_assets"),
    )
    op.create_index("ix_media_assets_content_type", "media_assets", ["content_type"], unique=False)
    op.create_index("ix_media_assets_deleted_at", "media_assets", ["deleted_at"], unique=False)

    op.create_table(
        "project_categories",
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=140), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        *base_columns(),
        *audit_constraints("project_categories"),
        sa.PrimaryKeyConstraint("id", name="pk_project_categories"),
        sa.UniqueConstraint("slug", name="uq_project_categories_slug"),
    )
    op.create_index(
        "ix_project_categories_deleted_at",
        "project_categories",
        ["deleted_at"],
        unique=False,
    )
    op.create_index("ix_project_categories_slug", "project_categories", ["slug"], unique=False)
    op.create_index(
        "ix_project_categories_sort_order",
        "project_categories",
        ["sort_order"],
        unique=False,
    )

    op.create_table(
        "technologies",
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=140), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("icon", sa.String(length=120), nullable=True),
        sa.Column("color", sa.String(length=32), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        *base_columns(),
        *audit_constraints("technologies"),
        sa.PrimaryKeyConstraint("id", name="pk_technologies"),
        sa.UniqueConstraint("slug", name="uq_technologies_slug"),
    )
    op.create_index("ix_technologies_category", "technologies", ["category"], unique=False)
    op.create_index("ix_technologies_deleted_at", "technologies", ["deleted_at"], unique=False)
    op.create_index("ix_technologies_slug", "technologies", ["slug"], unique=False)
    op.create_index("ix_technologies_sort_order", "technologies", ["sort_order"], unique=False)

    op.create_table(
        "projects",
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("cover_image_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("summary", sa.String(length=500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("repository_url", sa.Text(), nullable=True),
        sa.Column("live_url", sa.Text(), nullable=True),
        sa.Column("case_study_url", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("featured", sa.Boolean(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        *base_columns(),
        *audit_constraints("projects"),
        sa.CheckConstraint(
            "status IN ('draft', 'published', 'archived')",
            name="ck_projects_status",
        ),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["project_categories.id"],
            name="fk_projects_category_id_project_categories",
        ),
        sa.ForeignKeyConstraint(
            ["cover_image_id"],
            ["media_assets.id"],
            name="fk_projects_cover_image_id_media_assets",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_projects"),
        sa.UniqueConstraint("slug", name="uq_projects_slug"),
    )
    op.create_index("ix_projects_category_id", "projects", ["category_id"], unique=False)
    op.create_index("ix_projects_cover_image_id", "projects", ["cover_image_id"], unique=False)
    op.create_index("ix_projects_deleted_at", "projects", ["deleted_at"], unique=False)
    op.create_index("ix_projects_featured", "projects", ["featured"], unique=False)
    op.create_index("ix_projects_published_at", "projects", ["published_at"], unique=False)
    op.create_index("ix_projects_slug", "projects", ["slug"], unique=False)
    op.create_index("ix_projects_sort_order", "projects", ["sort_order"], unique=False)
    op.create_index("ix_projects_status", "projects", ["status"], unique=False)

    op.create_table(
        "project_technologies",
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("technology_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name="fk_project_technologies_project_id_projects",
        ),
        sa.ForeignKeyConstraint(
            ["technology_id"],
            ["technologies.id"],
            name="fk_project_technologies_technology_id_technologies",
        ),
        sa.PrimaryKeyConstraint("project_id", "technology_id", name="pk_project_technologies"),
    )
    op.create_index(
        "ix_project_technologies_technology_id",
        "project_technologies",
        ["technology_id"],
        unique=False,
    )

    op.create_table(
        "project_images",
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("media_asset_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("caption", sa.String(length=255), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        *base_columns(),
        *audit_constraints("project_images"),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name="fk_project_images_project_id_projects",
        ),
        sa.ForeignKeyConstraint(
            ["media_asset_id"],
            ["media_assets.id"],
            name="fk_project_images_media_asset_id_media_assets",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_project_images"),
        sa.UniqueConstraint("project_id", "media_asset_id", name="uq_project_images_project_media"),
    )
    op.create_index(
        "ix_project_images_media_asset_id",
        "project_images",
        ["media_asset_id"],
        unique=False,
    )
    op.create_index("ix_project_images_project_id", "project_images", ["project_id"], unique=False)
    op.create_index("ix_project_images_sort_order", "project_images", ["sort_order"], unique=False)

    op.create_table(
        "project_videos",
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("media_asset_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("external_url", sa.Text(), nullable=True),
        sa.Column("title", sa.String(length=180), nullable=True),
        sa.Column("caption", sa.String(length=255), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        *base_columns(),
        *audit_constraints("project_videos"),
        sa.CheckConstraint(
            "provider IN ('local', 'youtube', 'vimeo', 'loom', 'external')",
            name="ck_project_videos_provider",
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name="fk_project_videos_project_id_projects",
        ),
        sa.ForeignKeyConstraint(
            ["media_asset_id"],
            ["media_assets.id"],
            name="fk_project_videos_media_asset_id_media_assets",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_project_videos"),
    )
    op.create_index(
        "ix_project_videos_media_asset_id",
        "project_videos",
        ["media_asset_id"],
        unique=False,
    )
    op.create_index("ix_project_videos_project_id", "project_videos", ["project_id"], unique=False)
    op.create_index("ix_project_videos_provider", "project_videos", ["provider"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_project_videos_provider", table_name="project_videos")
    op.drop_index("ix_project_videos_project_id", table_name="project_videos")
    op.drop_index("ix_project_videos_media_asset_id", table_name="project_videos")
    op.drop_table("project_videos")

    op.drop_index("ix_project_images_sort_order", table_name="project_images")
    op.drop_index("ix_project_images_project_id", table_name="project_images")
    op.drop_index("ix_project_images_media_asset_id", table_name="project_images")
    op.drop_table("project_images")

    op.drop_index("ix_project_technologies_technology_id", table_name="project_technologies")
    op.drop_table("project_technologies")

    op.drop_index("ix_projects_status", table_name="projects")
    op.drop_index("ix_projects_sort_order", table_name="projects")
    op.drop_index("ix_projects_slug", table_name="projects")
    op.drop_index("ix_projects_published_at", table_name="projects")
    op.drop_index("ix_projects_featured", table_name="projects")
    op.drop_index("ix_projects_deleted_at", table_name="projects")
    op.drop_index("ix_projects_cover_image_id", table_name="projects")
    op.drop_index("ix_projects_category_id", table_name="projects")
    op.drop_table("projects")

    op.drop_index("ix_technologies_sort_order", table_name="technologies")
    op.drop_index("ix_technologies_slug", table_name="technologies")
    op.drop_index("ix_technologies_deleted_at", table_name="technologies")
    op.drop_index("ix_technologies_category", table_name="technologies")
    op.drop_table("technologies")

    op.drop_index("ix_project_categories_sort_order", table_name="project_categories")
    op.drop_index("ix_project_categories_slug", table_name="project_categories")
    op.drop_index("ix_project_categories_deleted_at", table_name="project_categories")
    op.drop_table("project_categories")

    op.drop_index("ix_media_assets_deleted_at", table_name="media_assets")
    op.drop_index("ix_media_assets_content_type", table_name="media_assets")
    op.drop_table("media_assets")
