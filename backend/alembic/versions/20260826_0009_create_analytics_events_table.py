"""create analytics events table

Revision ID: 20260826_0009
Revises: 20260826_0008
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260826_0009"
down_revision: str | None = "20260826_0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "analytics_events",
        sa.Column("event_name", sa.String(length=120), nullable=False),
        sa.Column("path", sa.Text(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("visitor_id", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_analytics_events")),
    )
    op.create_index("ix_analytics_events_created_at", "analytics_events", ["created_at"])
    op.create_index("ix_analytics_events_event_name", "analytics_events", ["event_name"])
    op.create_index("ix_analytics_events_path", "analytics_events", ["path"])


def downgrade() -> None:
    op.drop_index("ix_analytics_events_path", table_name="analytics_events")
    op.drop_index("ix_analytics_events_event_name", table_name="analytics_events")
    op.drop_index("ix_analytics_events_created_at", table_name="analytics_events")
    op.drop_table("analytics_events")
