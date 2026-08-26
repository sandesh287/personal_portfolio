from collections.abc import Sequence
from datetime import datetime

from app.models.analytics_event import AnalyticsEvent
from app.models.message import Message
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session


class AnalyticsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def add(self, event: AnalyticsEvent) -> AnalyticsEvent:
        self.db.add(event)
        return event

    def count_events(self, event_name: str, start: datetime, end: datetime) -> int:
        return (
            self.db.scalar(
                select(func.count(AnalyticsEvent.id)).where(
                    AnalyticsEvent.event_name == event_name,
                    AnalyticsEvent.created_at >= start,
                    AnalyticsEvent.created_at < end,
                )
            )
            or 0
        )

    def count_distinct_visitors(self, start: datetime, end: datetime) -> int:
        return (
            self.db.scalar(
                select(func.count(func.distinct(AnalyticsEvent.visitor_id))).where(
                    AnalyticsEvent.created_at >= start,
                    AnalyticsEvent.created_at < end,
                    AnalyticsEvent.visitor_id.is_not(None),
                )
            )
            or 0
        )

    def count_messages(self, start: datetime, end: datetime) -> int:
        return (
            self.db.scalar(
                select(func.count(Message.id)).where(
                    Message.created_at >= start,
                    Message.created_at < end,
                    Message.deleted_at.is_(None),
                )
            )
            or 0
        )

    def popular_paths(
        self, start: datetime, end: datetime, limit: int = 6
    ) -> Sequence[tuple[str, int]]:
        count = func.count(AnalyticsEvent.id).label("views")
        return self.db.execute(
            select(AnalyticsEvent.path, count)
            .where(
                AnalyticsEvent.event_name == "page_viewed",
                AnalyticsEvent.path.is_not(None),
                AnalyticsEvent.created_at >= start,
                AnalyticsEvent.created_at < end,
            )
            .group_by(AnalyticsEvent.path)
            .order_by(desc(count))
            .limit(limit)
        ).all()

    def event_dates(self, event_name: str, start: datetime, end: datetime) -> Sequence[datetime]:
        return self.db.scalars(
            select(AnalyticsEvent.created_at).where(
                AnalyticsEvent.event_name == event_name,
                AnalyticsEvent.created_at >= start,
                AnalyticsEvent.created_at < end,
            )
        ).all()
