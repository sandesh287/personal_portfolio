"""create experience and education tables

Revision ID: 20260826_0003
Revises: 20260826_0002
Create Date: 2026-08-26
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260826_0003"
down_revision: str | None = "20260826_0002"
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
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], name=f"fk_{table_name}_created_by_id_users"),
        sa.ForeignKeyConstraint(["updated_by_id"], ["users.id"], name=f"fk_{table_name}_updated_by_id_users"),
    ]


def upgrade() -> None:
    op.create_table(
        "experiences",
        sa.Column("company", sa.String(length=180), nullable=False),
        sa.Column("role", sa.String(length=180), nullable=False),
        sa.Column("employment_type", sa.String(length=80), nullable=True),
        sa.Column("location", sa.String(length=180), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("current", sa.Boolean(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("achievements", sa.JSON(), nullable=False),
        sa.Column("technologies", sa.JSON(), nullable=False),
        sa.Column("company_url", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("published", sa.Boolean(), nullable=False),
        *base_columns(),
        *audit_constraints("experiences"),
        sa.CheckConstraint("end_date IS NULL OR end_date >= start_date", name="ck_experiences_experience_dates_valid"),
        sa.PrimaryKeyConstraint("id", name="pk_experiences"),
    )
    for column in ("current", "deleted_at", "published", "sort_order", "start_date"):
        op.create_index(f"ix_experiences_{column}", "experiences", [column])

    op.create_table(
        "education",
        sa.Column("institution", sa.String(length=180), nullable=False),
        sa.Column("degree", sa.String(length=180), nullable=False),
        sa.Column("field_of_study", sa.String(length=180), nullable=True),
        sa.Column("location", sa.String(length=180), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("current", sa.Boolean(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("achievements", sa.JSON(), nullable=False),
        sa.Column("institution_url", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("published", sa.Boolean(), nullable=False),
        *base_columns(),
        *audit_constraints("education"),
        sa.CheckConstraint("end_date IS NULL OR end_date >= start_date", name="ck_education_education_dates_valid"),
        sa.PrimaryKeyConstraint("id", name="pk_education"),
    )
    for column in ("current", "deleted_at", "published", "sort_order", "start_date"):
        op.create_index(f"ix_education_{column}", "education", [column])


def downgrade() -> None:
    for column in ("start_date", "sort_order", "published", "deleted_at", "current"):
        op.drop_index(f"ix_education_{column}", table_name="education")
    op.drop_table("education")
    for column in ("start_date", "sort_order", "published", "deleted_at", "current"):
        op.drop_index(f"ix_experiences_{column}", table_name="experiences")
    op.drop_table("experiences")
