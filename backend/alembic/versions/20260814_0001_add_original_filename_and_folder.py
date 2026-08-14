"""add original_filename and folder to media_assets

Revision ID: 20260814_0001
Revises: 20260804_0002
Create Date: 2026-08-14

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260814_0001"
down_revision: str | None = "20260804_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "media_assets", sa.Column("original_filename", sa.String(length=255), nullable=True)
    )
    op.add_column("media_assets", sa.Column("folder", sa.String(length=120), nullable=True))
    op.create_index("ix_media_assets_folder", "media_assets", ["folder"], unique=False)

    op.execute(
        "UPDATE media_assets SET original_filename = filename WHERE original_filename IS NULL"
    )
    op.alter_column("media_assets", "original_filename", nullable=False)


def downgrade() -> None:
    op.drop_index("ix_media_assets_folder", table_name="media_assets")
    op.drop_column("media_assets", "folder")
    op.drop_column("media_assets", "original_filename")
