import {
  AlertTriangle,
  BookOpen,
  ExternalLink,
  GitCommitHorizontal,
  GitFork,
  Github,
  MapPin,
  Search,
  Star,
  Users,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { SelectField } from "@/components/form/SelectField";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGitHubActivity, useGitHubRepositories, useGitHubSummary } from "@/features/github";
import type { GitHubRepository } from "@/features/github";
import { cn } from "@/utils/cn";
import { getErrorMessage } from "@/utils/errors";

const PAGE_SIZE = 12;

export function GitHubPage() {
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState<"updatedAt" | "stars" | "forks" | "name">("updatedAt");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<GitHubRepository | null>(null);
  const deferredSearch = useDeferredValue(search.trim());
  const summary = useGitHubSummary();
  const allRepositories = useGitHubRepositories({ pageSize: 100, sort: "name", order: "asc" });
  const repositories = useGitHubRepositories({
    page,
    pageSize: PAGE_SIZE,
    search: deferredSearch || undefined,
    language: language || undefined,
    sort,
    order: sort === "name" ? "asc" : "desc",
  });
  const activity = useGitHubActivity({ pageSize: 20 });
  const languages = useMemo(
    () =>
      [
        ...new Set(allRepositories.data?.items.map((item) => item.language).filter(Boolean) ?? []),
      ].sort() as string[],
    [allRepositories.data?.items],
  );

  useEffect(() => setPage(1), [deferredSearch, language, sort]);
  useEffect(() => {
    if (!selected && repositories.data?.items[0]) setSelected(repositories.data.items[0]);
  }, [repositories.data?.items, selected]);

  if (summary.isLoading) return <GitHubSkeleton />;
  if (summary.isError) {
    return (
      <EmptyState
        title="GitHub Explorer is unavailable"
        description={getErrorMessage(summary.error, "Configure a GitHub username in Settings.")}
      />
    );
  }
  if (!summary.data) return null;

  const profile = summary.data.profile;
  return (
    <section className="min-h-[calc(100dvh-7rem)] bg-surface">
      {summary.data.stale ? (
        <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-foreground">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          GitHub is temporarily unavailable. Showing the latest cached snapshot.
        </div>
      ) : null}
      <header className="border-b border-border p-4 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <img
              src={profile.avatarUrl}
              alt={`${profile.name ?? profile.username} GitHub avatar`}
              className="h-16 w-16 shrink-0 rounded-md border border-border object-cover sm:h-20 sm:w-20"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase text-muted-foreground">GitHub Explorer</p>
              <h1 className="mt-1 break-words text-2xl font-semibold text-foreground">
                {profile.name ?? profile.username}
              </h1>
              <p className="mt-1 text-sm text-primary">@{profile.username}</p>
              {profile.bio ? (
                <p className="mt-3 max-w-xl text-sm text-muted-foreground">{profile.bio}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                {profile.location ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.location}
                  </span>
                ) : null}
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {profile.followers} followers
                </span>
              </div>
            </div>
          </div>
          <a
            href={profile.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            <Github className="h-4 w-4" /> View profile <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            label="Repositories"
            value={profile.publicRepositories}
            icon={<BookOpen className="h-4 w-4" />}
          />
          <Stat
            label="Stars"
            value={summary.data.stats.totalStars}
            icon={<Star className="h-4 w-4" />}
          />
          <Stat
            label="Forks"
            value={summary.data.stats.totalForks}
            icon={<GitFork className="h-4 w-4" />}
          />
          <Stat
            label="Recent commits"
            value={summary.data.stats.recentCommits}
            icon={<GitCommitHorizontal className="h-4 w-4" />}
          />
        </div>
      </header>

      <div className="grid min-h-[38rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="min-w-0 border-b border-border xl:border-b-0 xl:border-r">
          <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4 lg:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search repositories</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter repositories..."
                className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <SelectField
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full lg:w-44"
              aria-label="Filter by language"
            >
              <option value="">All languages</option>
              {languages.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectField>
            <SelectField
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof sort)}
              className="w-full lg:w-44"
              aria-label="Sort repositories"
            >
              <option value="updatedAt">Recently updated</option>
              <option value="stars">Most stars</option>
              <option value="forks">Most forks</option>
              <option value="name">Name</option>
            </SelectField>
          </div>
          {repositories.isLoading ? <RepositorySkeleton /> : null}
          {repositories.isError ? (
            <div className="p-4">
              <EmptyState
                title="Repositories could not be loaded"
                description={getErrorMessage(repositories.error)}
              />
            </div>
          ) : null}
          {!repositories.isLoading && repositories.data?.items.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No repositories found"
                description="Adjust the current search or language filter."
              />
            </div>
          ) : null}
          <div className="divide-y divide-border">
            {repositories.data?.items.map((repository) => (
              <button
                key={repository.id}
                type="button"
                onClick={() => setSelected(repository)}
                className={cn(
                  "grid w-full gap-3 p-4 text-left hover:bg-muted/50 sm:grid-cols-[minmax(0,1fr)_8rem_5rem_6rem] sm:items-center",
                  selected?.id === repository.id && "bg-primary/[0.05]",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-primary">
                    {repository.name}
                  </span>
                  <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">
                    {repository.description ?? "No description provided."}
                  </span>
                </span>
                <span className="text-xs text-foreground">{repository.language ?? "Other"}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5" />
                  {repository.stars}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(repository.updatedAt)}
                </span>
              </button>
            ))}
          </div>
          {repositories.data && repositories.data.meta.totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-border p-3">
              <Button
                size="sm"
                variant="ghost"
                disabled={!repositories.data.meta.hasPreviousPage}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                {page} / {repositories.data.meta.totalPages}
              </span>
              <Button
                size="sm"
                variant="ghost"
                disabled={!repositories.data.meta.hasNextPage}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </main>
        <RepositoryInspector repository={selected} />
      </div>

      <section className="border-t border-border bg-background">
        <header className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Recent public activity</h2>
        </header>
        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
          {activity.data?.items.map((event) => (
            <a
              key={event.id}
              href={event.repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 bg-background p-4 hover:bg-muted/60"
            >
              <p className="truncate font-mono text-xs font-medium text-primary">
                {event.repositoryName}
              </p>
              <p className="mt-2 text-sm text-foreground">{event.summary}</p>
              <time className="mt-2 block text-xs text-muted-foreground">
                {formatDate(event.createdAt)}
              </time>
            </a>
          ))}
        </div>
      </section>
    </section>
  );
}

function RepositoryInspector({ repository }: { repository: GitHubRepository | null }) {
  if (!repository)
    return (
      <aside className="p-4">
        <EmptyState
          title="Select a repository"
          description="Inspect repository metadata and links."
        />
      </aside>
    );
  return (
    <aside className="min-w-0 bg-muted/30 p-4 sm:p-6">
      <p className="text-xs font-medium uppercase text-muted-foreground">Repository inspector</p>
      <h2 className="mt-3 break-words text-lg font-semibold text-foreground">{repository.name}</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {repository.description ?? "No description provided."}
      </p>
      <dl className="mt-6 grid grid-cols-2 gap-4 text-xs">
        <div>
          <dt className="text-muted-foreground">Language</dt>
          <dd className="mt-1 font-medium text-foreground">{repository.language ?? "Other"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Branch</dt>
          <dd className="mt-1 font-medium text-foreground">{repository.defaultBranch}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Stars</dt>
          <dd className="mt-1 font-medium text-foreground">{repository.stars}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Open issues</dt>
          <dd className="mt-1 font-medium text-foreground">{repository.openIssues}</dd>
        </div>
      </dl>
      {repository.topics.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {repository.topics.map((topic) => (
            <span key={topic} className="rounded-sm bg-primary/10 px-2 py-1 text-xs text-primary">
              {topic}
            </span>
          ))}
        </div>
      ) : null}
      <a
        href={repository.url}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
      >
        Open repository <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </aside>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
function GitHubSkeleton() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Skeleton className="h-28 w-full" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
function RepositorySkeleton() {
  return (
    <div>
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="space-y-2 border-b border-border p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
