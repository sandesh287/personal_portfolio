"""create skills table

Revision ID: 20260826_0004
Revises: 20260826_0003
Create Date: 2026-08-26
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260826_0004"
down_revision: str | None = "20260826_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "skills",
        sa.Column("technology_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=140), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("icon", sa.String(length=120), nullable=True),
        sa.Column("color", sa.String(length=32), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.CheckConstraint("level BETWEEN 1 AND 5", name="ck_skills_level_valid"),
        sa.ForeignKeyConstraint(["technology_id"], ["technologies.id"], name="fk_skills_technology_id_technologies"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], name="fk_skills_created_by_id_users"),
        sa.ForeignKeyConstraint(["updated_by_id"], ["users.id"], name="fk_skills_updated_by_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_skills"),
        sa.UniqueConstraint("slug", name="uq_skills_slug"),
    )
    for column in ("category", "deleted_at", "level", "slug", "sort_order", "technology_id"):
        op.create_index(f"ix_skills_{column}", "skills", [column])


def downgrade() -> None:
    for column in ("technology_id", "sort_order", "slug", "level", "deleted_at", "category"):
        op.drop_index(f"ix_skills_{column}", table_name="skills")
    op.drop_table("skills")
