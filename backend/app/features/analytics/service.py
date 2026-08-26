from collections import Counter
from datetime import UTC, date, datetime, time, timedelta

from app.features.analytics.repository import AnalyticsRepository
from app.features.analytics.schemas import (
    AnalyticsEventCreate,
    AnalyticsInterval,
    AnalyticsMetric,
    AnalyticsPoint,
    AnalyticsReceipt,
    AnalyticsSummary,
    AnalyticsTimeSeries,
    PopularContent,
)
from app.features.settings.repository import SettingRepository
from app.models.analytics_event import AnalyticsEvent


class AnalyticsService:
    def __init__(self, repository: AnalyticsRepository, settings: SettingRepository) -> None:
        self.repository = repository
        self.settings = settings

    def track(self, payload: AnalyticsEventCreate) -> AnalyticsReceipt:
        setting = self.settings.get_by_key("analytics_enabled")
        if setting is None or setting.value is False:
            return AnalyticsReceipt(tracked=False)
        event = AnalyticsEvent(
            event_name=payload.event_name.value,
            path=payload.path,
            metadata_json=payload.metadata,
            visitor_id=payload.visitor_id,
            created_at=datetime.now(UTC),
        )
        self.repository.add(event)
        self.repository.db.commit()
        return AnalyticsReceipt(tracked=True)

    def summary(self, start: date, end: date) -> AnalyticsSummary:
        start_at, end_at = self._range(start, end)
        previous_start = start_at - (end_at - start_at)
        definitions = (
            ("visitors", "Visitors", None),
            ("pageViews", "Page views", "page_viewed"),
            ("projectViews", "Project views", "project_viewed"),
            ("blogViews", "Blog views", "blog_viewed"),
            ("resumeDownloads", "Resume downloads", "resume_downloaded"),
            ("githubViews", "GitHub views", "github_viewed"),
            ("messages", "Messages", None),
        )
        metrics = []
        for key, label, event_name in definitions:
            current = self._count(key, event_name, start_at, end_at)
            previous = self._count(key, event_name, previous_start, start_at)
            change = None if previous == 0 else round(((current - previous) / previous) * 100, 1)
            metrics.append(AnalyticsMetric(key=key, label=label, value=current, change=change))
        popular = [
            PopularContent(path=path, views=views)
            for path, views in self.repository.popular_paths(start_at, end_at)
        ]
        return AnalyticsSummary(
            from_date=start_at, to_date=end_at, metrics=metrics, popular_content=popular
        )

    def timeseries(
        self, start: date, end: date, metric: str, interval: AnalyticsInterval
    ) -> AnalyticsTimeSeries:
        start_at, end_at = self._range(start, end)
        event_name = "page_viewed" if metric == "visitors" else metric
        counts = Counter(
            self._bucket_date(value.date(), interval)
            for value in self.repository.event_dates(event_name, start_at, end_at)
        )
        points = []
        cursor = self._bucket_date(start_at.date(), interval)
        last = self._bucket_date((end_at - timedelta(microseconds=1)).date(), interval)
        while cursor <= last:
            points.append(AnalyticsPoint(date=cursor, value=counts[cursor]))
            cursor = self._next_bucket(cursor, interval)
        return AnalyticsTimeSeries(metric=metric, interval=interval, points=points)

    def _count(self, key: str, event_name: str | None, start: datetime, end: datetime) -> int:
        if key == "visitors":
            return self.repository.count_distinct_visitors(start, end)
        if key == "messages":
            return self.repository.count_messages(start, end)
        return self.repository.count_events(event_name or key, start, end)

    @staticmethod
    def _range(start: date, end: date) -> tuple[datetime, datetime]:
        return datetime.combine(start, time.min, UTC), datetime.combine(
            end + timedelta(days=1), time.min, UTC
        )

    @staticmethod
    def _bucket_date(value: date, interval: AnalyticsInterval) -> date:
        if interval == AnalyticsInterval.MONTH:
            return value.replace(day=1)
        if interval == AnalyticsInterval.WEEK:
            return value - timedelta(days=value.weekday())
        return value

    @staticmethod
    def _next_bucket(value: date, interval: AnalyticsInterval) -> date:
        if interval == AnalyticsInterval.MONTH:
            return value.replace(year=value.year + (value.month == 12), month=value.month % 12 + 1)
        return value + timedelta(days=7 if interval == AnalyticsInterval.WEEK else 1)
