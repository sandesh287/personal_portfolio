from datetime import date, timedelta
from typing import Annotated

from app.auth.dependencies import CurrentUser, require_admin
from app.features.analytics.dependencies import get_analytics_service
from app.features.analytics.schemas import (
    AnalyticsEventCreate,
    AnalyticsInterval,
    AnalyticsReceipt,
    AnalyticsSummary,
    AnalyticsTimeSeries,
)
from app.features.analytics.service import AnalyticsService
from app.schemas.base import ApiResponse
from fastapi import APIRouter, Depends, Query, status

router = APIRouter()


@router.post(
    "/events", response_model=ApiResponse[AnalyticsReceipt], status_code=status.HTTP_201_CREATED
)
async def track_event(
    payload: AnalyticsEventCreate,
    service: Annotated[AnalyticsService, Depends(get_analytics_service)],
) -> ApiResponse[AnalyticsReceipt]:
    return ApiResponse(data=service.track(payload))


@router.get("/summary", response_model=ApiResponse[AnalyticsSummary])
async def analytics_summary(
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[AnalyticsService, Depends(get_analytics_service)],
    from_date: Annotated[date | None, Query(alias="from")] = None,
    to_date: Annotated[date | None, Query(alias="to")] = None,
) -> ApiResponse[AnalyticsSummary]:
    end = to_date or date.today()
    start = from_date or end - timedelta(days=29)
    return ApiResponse(data=service.summary(start, end))


@router.get("/timeseries", response_model=ApiResponse[AnalyticsTimeSeries])
async def analytics_timeseries(
    _: Annotated[CurrentUser, Depends(require_admin)],
    service: Annotated[AnalyticsService, Depends(get_analytics_service)],
    metric: Annotated[str, Query(pattern="^[a-z_]+$")] = "page_viewed",
    interval: AnalyticsInterval = AnalyticsInterval.DAY,
    from_date: Annotated[date | None, Query(alias="from")] = None,
    to_date: Annotated[date | None, Query(alias="to")] = None,
) -> ApiResponse[AnalyticsTimeSeries]:
    end = to_date or date.today()
    start = from_date or end - timedelta(days=29)
    return ApiResponse(data=service.timeseries(start, end, metric, interval))
