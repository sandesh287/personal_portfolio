"""create settings table

Revision ID: 20260826_0007
Revises: 20260826_0006
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260826_0007"
down_revision: str | None = "20260826_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "settings",
        sa.Column("key", sa.String(length=120), nullable=False),
        sa.Column("value", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("scope", sa.String(length=50), server_default="public", nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_public", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.CheckConstraint(
            "scope IN ('public', 'admin', 'system')", name="ck_settings_scope_valid"
        ),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["updated_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key", name="uq_settings_key"),
    )
    op.create_index("ix_settings_scope", "settings", ["scope"])
    op.create_index("ix_settings_is_public", "settings", ["is_public"])


def downgrade() -> None:
    op.drop_index("ix_settings_is_public", table_name="settings")
    op.drop_index("ix_settings_scope", table_name="settings")
    op.drop_table("settings")
