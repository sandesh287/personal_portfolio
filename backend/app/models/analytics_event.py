from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Index, String, Text
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDPrimaryKeyMixin


class AnalyticsEvent(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "analytics_events"
    __table_args__ = (
        Index("ix_analytics_events_event_name", "event_name"),
        Index("ix_analytics_events_created_at", "created_at"),
        Index("ix_analytics_events_path", "path"),
    )

    event_name: Mapped[str] = mapped_column(String(120), nullable=False)
    path: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        JSON().with_variant(postgresql.JSONB(), "postgresql"), default=dict, nullable=False
    )
    visitor_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
