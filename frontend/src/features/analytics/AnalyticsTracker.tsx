import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

import { usePublicSettings } from "@/features/settings";

import { analyticsApi } from "./api";
import type { AnalyticsEventName } from "./types";

const VISITOR_KEY = "portfolio_analytics_visitor";

export function AnalyticsTracker() {
  const location = useLocation();
  const settings = usePublicSettings();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!settings.data?.analyticsEnabled || lastPath.current === location.pathname) return;
    lastPath.current = location.pathname;
    const visitorId = getVisitorId();
    const payload = { path: location.pathname, visitorId };
    void analyticsApi.track({ ...payload, eventName: "page_viewed" }).catch(() => undefined);
    const featureEvent = eventForPath(location.pathname);
    if (featureEvent) void analyticsApi.track({ ...payload, eventName: featureEvent }).catch(() => undefined);
  }, [location.pathname, settings.data?.analyticsEnabled]);

  return null;
}

function getVisitorId() {
  const existing = localStorage.getItem(VISITOR_KEY);
  if (existing) return existing;
  const value = crypto.randomUUID().replaceAll("-", "");
  localStorage.setItem(VISITOR_KEY, value);
  return value;
}

function eventForPath(path: string): AnalyticsEventName | null {
  if (path.startsWith("/projects/")) return "project_viewed";
  if (path.startsWith("/blog/")) return "blog_viewed";
  if (path === "/resume") return "resume_viewed";
  if (path === "/github") return "github_viewed";
  return null;
}
