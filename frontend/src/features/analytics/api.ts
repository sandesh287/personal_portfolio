import { getApiData } from "@/services/api";
import { httpClient } from "@/services/httpClient";
import type { ApiResponse } from "@/types/api";

import type { AnalyticsEventPayload, AnalyticsRange, AnalyticsSummary, AnalyticsTimeSeries } from "./types";

const ENDPOINT = "/analytics";

export const analyticsApi = {
  async track(payload: AnalyticsEventPayload) {
    const response = await httpClient.post<ApiResponse<{ tracked: boolean }>>(`${ENDPOINT}/events`, payload);
    return response.data.data;
  },
  summary(range: AnalyticsRange) {
    return getApiData<AnalyticsSummary>(`${ENDPOINT}/summary`, { params: range });
  },
  timeseries(range: AnalyticsRange) {
    return getApiData<AnalyticsTimeSeries>(`${ENDPOINT}/timeseries`, {
      params: { ...range, metric: "page_viewed", interval: "day" },
    });
  },
};
