"""add image metadata to media assets

Revision ID: 20260826_0001
Revises: 20260814_0001
Create Date: 2026-08-26
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260826_0001"
down_revision: str | None = "20260814_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("media_assets", sa.Column("image_width", sa.Integer(), nullable=True))
    op.add_column("media_assets", sa.Column("image_height", sa.Integer(), nullable=True))
    op.add_column("media_assets", sa.Column("placeholder_url", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("media_assets", "placeholder_url")
    op.drop_column("media_assets", "image_height")
    op.drop_column("media_assets", "image_width")
