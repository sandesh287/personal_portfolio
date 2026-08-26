"""create certifications table

Revision ID: 20260826_0010
Revises: 20260826_0009
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260826_0010"
down_revision: str | None = "20260826_0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "certifications",
        sa.Column("credential_media_id", sa.Uuid(), nullable=True),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("issuer", sa.String(length=180), nullable=False),
        sa.Column("credential_id", sa.String(length=180), nullable=True),
        sa.Column("credential_url", sa.Text(), nullable=True),
        sa.Column("issued_at", sa.Date(), nullable=True),
        sa.Column("expires_at", sa.Date(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("published", sa.Boolean(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_id", sa.Uuid(), nullable=True),
        sa.Column("updated_by_id", sa.Uuid(), nullable=True),
        sa.CheckConstraint(
            "expires_at IS NULL OR issued_at IS NULL OR expires_at >= issued_at",
            name=op.f("ck_certifications_certification_dates_valid"),
        ),
        sa.ForeignKeyConstraint(
            ["credential_media_id"],
            ["media_assets.id"],
            name=op.f("fk_certifications_credential_media_id_media_assets"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_certifications")),
    )
    for column in ("credential_media_id", "issuer", "issued_at", "sort_order"):
        op.create_index(op.f(f"ix_certifications_{column}"), "certifications", [column])


def downgrade() -> None:
    for column in ("sort_order", "issued_at", "issuer", "credential_media_id"):
        op.drop_index(op.f(f"ix_certifications_{column}"), table_name="certifications")
    op.drop_table("certifications")
