import { useMutation, useQuery } from "@tanstack/react-query";

import { analyticsApi } from "./api";
import type { AnalyticsEventPayload, AnalyticsRange } from "./types";

export function useTrackAnalyticsEvent() {
  return useMutation({ mutationFn: (payload: AnalyticsEventPayload) => analyticsApi.track(payload) });
}

export function useAnalyticsSummary(range: AnalyticsRange) {
  return useQuery({
    queryKey: ["analytics", "summary", range],
    queryFn: () => analyticsApi.summary(range),
  });
}

export function useAnalyticsTimeSeries(range: AnalyticsRange) {
  return useQuery({
    queryKey: ["analytics", "timeseries", range],
    queryFn: () => analyticsApi.timeseries(range),
  });
}
