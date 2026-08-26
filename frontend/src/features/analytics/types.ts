export type AnalyticsEventName =
  | "page_viewed"
  | "project_viewed"
  | "blog_viewed"
  | "resume_viewed"
  | "resume_downloaded"
  | "github_viewed"
  | "contact_submitted";

export interface AnalyticsEventPayload {
  eventName: AnalyticsEventName;
  path?: string;
  metadata?: Record<string, string | number | boolean | null>;
  visitorId?: string;
}

export interface AnalyticsMetric {
  key: string;
  label: string;
  value: number;
  change: number | null;
}

export interface AnalyticsSummary {
  fromDate: string;
  toDate: string;
  metrics: AnalyticsMetric[];
  popularContent: { path: string; views: number }[];
}

export interface AnalyticsTimeSeries {
  metric: string;
  interval: "day" | "week" | "month";
  points: { date: string; value: number }[];
}

export interface AnalyticsRange {
  from: string;
  to: string;
}
