import { ArrowDownRight, ArrowUpRight, BarChart3, Eye, Minus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAnalyticsSummary, useAnalyticsTimeSeries } from "@/features/analytics";
import { getErrorMessage } from "@/utils/errors";

type RangeDays = 7 | 30 | 90;

export function AdminDashboardPage() {
  const [days, setDays] = useState<RangeDays>(30);
  const range = useMemo(() => createRange(days), [days]);
  const summary = useAnalyticsSummary(range);
  const series = useAnalyticsTimeSeries(range);

  if (summary.isLoading || series.isLoading) return <DashboardSkeleton />;
  if (summary.isError || series.isError) {
    return (
      <div className="space-y-3">
        <EmptyState
          title="Analytics could not be loaded"
          description={getErrorMessage(summary.error ?? series.error)}
        />
        <Button onClick={() => void Promise.all([summary.refetch(), series.refetch()])}>Retry</Button>
      </div>
    );
  }

  const metrics = summary.data?.metrics ?? [];
  return (
    <div className="space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">Workspace telemetry</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Analytics dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">First-party portfolio activity and content performance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[7, 30, 90].map((value) => (
            <Button key={value} size="sm" variant={days === value ? "primary" : "secondary"} onClick={() => setDays(value as RangeDays)}>
              {value} days
            </Button>
          ))}
          <Button size="icon" variant="ghost" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => void Promise.all([summary.refetch(), series.refetch()])}>
            Refresh analytics
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Analytics summary">
        {metrics.map((metric) => (
          <MetricCard key={metric.key} label={metric.label} value={metric.value} change={metric.change} />
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Daily page views</CardTitle>
          </CardHeader>
          <CardContent><ActivityChart points={series.data?.points ?? []} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Popular content</CardTitle></CardHeader>
          <div className="divide-y divide-border">
            {summary.data?.popularContent.length ? summary.data.popularContent.map((item, index) => (
              <div key={item.path} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 text-sm">
                <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                <span className="truncate font-medium text-foreground" title={item.path}>{item.path}</span>
                <span className="text-xs text-muted-foreground">{item.views}</span>
              </div>
            )) : <div className="p-4"><EmptyState title="No page views yet" description="Activity will appear after analytics is enabled and visitors browse the portfolio." /></div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ label, value, change }: { label: string; value: number; change: number | null }) {
  const positive = change !== null && change > 0;
  const negative = change !== null && change < 0;
  return (
    <Card className="min-w-0">
      <CardContent className="p-3 sm:p-4">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-foreground">{value.toLocaleString()}</p>
        <p className={`mt-2 flex items-center gap-1 text-xs ${positive ? "text-emerald-600 dark:text-emerald-400" : negative ? "text-destructive" : "text-muted-foreground"}`}>
          {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : negative ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
          {change === null ? "No prior data" : `${Math.abs(change)}% vs prior period`}
        </p>
      </CardContent>
    </Card>
  );
}

function ActivityChart({ points }: { points: { date: string; value: number }[] }) {
  const max = Math.max(...points.map((point) => point.value), 1);
  if (!points.some((point) => point.value)) return <EmptyState title="No activity in this period" description="Page views will be charted here as they arrive." />;
  return (
    <div className="flex h-64 items-end gap-1 overflow-hidden border-b border-l border-border px-2 pt-3" role="img" aria-label="Daily page views bar chart">
      {points.map((point) => (
        <div key={point.date} className="group relative flex min-w-0 flex-1 items-end self-stretch">
          <div className="w-full min-w-[3px] bg-primary/75 transition-colors group-hover:bg-primary" style={{ height: `${Math.max((point.value / max) * 100, 2)}%` }} />
          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-sm bg-foreground px-2 py-1 text-xs text-background group-hover:block">{point.date}: {point.value}</span>
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return <div className="space-y-4"><Skeleton className="h-24" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[1,2,3,4].map((item) => <Skeleton key={item} className="h-28" />)}</div><Skeleton className="h-80" /></div>;
}

function createRange(days: RangeDays) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days + 1);
  return { from: formatDate(from), to: formatDate(to) };
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}
