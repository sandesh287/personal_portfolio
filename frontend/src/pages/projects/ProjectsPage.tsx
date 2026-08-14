import { ArrowRight, Code2, ExternalLink, Github, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { routes } from "@/constants/routes";
import { useProjectCategories, useProjects, useTechnologies } from "@/features/projects";
import type { Project, ProjectCategory, Technology } from "@/features/projects";
import { cn } from "@/utils/cn";
import { getErrorMessage } from "@/utils/errors";

const PAGE_SIZE = 8;

export function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [technologyId, setTechnologyId] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const queryParams = {
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
    categoryId,
    technologyId,
    sort: "sortOrder" as const,
    order: "asc" as const,
  };

  const { data, error, isError, isFetching, isLoading } = useProjects(queryParams);
  const { data: categories = [], isLoading: areCategoriesLoading } = useProjectCategories();
  const { data: technologies = [], isLoading: areTechnologiesLoading } = useTechnologies();
  const projects = useMemo(() => data?.items ?? [], [data?.items]);
  const meta = data?.meta;

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCategoryChange(nextCategoryId: string | undefined) {
    setCategoryId(nextCategoryId);
    setPage(1);
  }

  function handleTechnologyChange(nextTechnologyId: string | undefined) {
    setTechnologyId(nextTechnologyId);
    setPage(1);
  }

  return (
    <section className="min-h-[calc(100vh-8rem)] bg-surface">
      <header className="border-b border-border">
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Projects Explorer</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">Repository workspace</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Browse Sandesh&apos;s React, Flutter, and data science work from one searchable
              engineering surface.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-md border border-border bg-background p-2 text-center">
            <Metric label="Projects" value={meta?.totalItems ?? projects.length} />
            <Metric label="Featured" value={projects.filter((project) => project.featured).length} />
            <Metric label="Tech" value={technologies.length} />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border p-4">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search projects</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search projects..."
              className={cn(
                "h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm",
                "text-foreground outline-none transition-colors placeholder:text-muted-foreground",
                "focus:border-primary focus:ring-2 focus:ring-primary/20",
              )}
            />
          </label>

          <FilterGroup
            label="Category"
            allLabel="All categories"
            items={categories}
            activeId={categoryId}
            isLoading={areCategoriesLoading}
            getItemLabel={(category) => category.name}
            onChange={handleCategoryChange}
          />

          <FilterGroup
            label="Technology"
            allLabel="All tech"
            items={technologies}
            activeId={technologyId}
            isLoading={areTechnologiesLoading}
            getItemLabel={(technology) => technology.name}
            onChange={handleTechnologyChange}
          />
        </div>
      </header>

      {isError ? (
        <div className="p-4">
          <EmptyState
            title="Projects could not be loaded"
            description={getErrorMessage(error, "Check that the backend is running and try again.")}
          />
        </div>
      ) : null}

      {isLoading ? <ProjectListSkeleton /> : null}

      {!isLoading && !isError && projects.length === 0 ? (
        <div className="p-4">
          <EmptyState
            title="No projects found"
            description="Try a different search term or clear the selected technology filter."
          />
        </div>
      ) : null}

      {!isLoading && !isError && projects.length > 0 ? (
        <div className="space-y-3 p-4">
          {isFetching ? (
            <p className="text-xs text-muted-foreground" role="status">
              Refreshing project index...
            </p>
          ) : null}
          {projects.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
          {meta ? (
            <footer className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages || 1}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!meta.hasPreviousPage}
                  onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </footer>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const coverImage =
    project.images.find((image) => image.mediaAssetId === project.coverImageId)?.url ??
    project.images[0]?.url;

  return (
    <article className="group flex flex-col gap-4 rounded-md border border-border bg-background p-4 transition-colors hover:border-primary/60 sm:flex-row">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {coverImage ? (
          <img src={coverImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Code2 className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-foreground">{project.title}</h2>
              {project.featured ? (
                <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Star className="h-3 w-3" aria-hidden="true" />
                  Featured
                </span>
              ) : null}
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {project.summary}
            </p>
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {project.technologies.slice(0, 6).map((technology) => (
            <span
              key={technology.id}
              className="rounded border border-border bg-surface px-2 py-1 text-xs text-muted-foreground"
            >
              {technology.name}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            to={routes.projectDetails.replace(":slug", project.slug)}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Open project
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          {project.repositoryUrl ? (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              Source
            </a>
          ) : null}
          {project.liveUrl ? (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Live
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ProjectListSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-label="Loading projects">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-4 rounded-md border border-border bg-background p-4 sm:flex-row"
        >
          <Skeleton className="h-12 w-12" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-7 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-20 px-3">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function FilterChip({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-full border px-3 text-xs font-medium transition-colors",
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function FilterGroup<TItem extends ProjectCategory | Technology>({
  label,
  allLabel,
  items,
  activeId,
  isLoading,
  getItemLabel,
  onChange,
}: {
  label: string;
  allLabel: string;
  items: TItem[];
  activeId: string | undefined;
  isLoading: boolean;
  getItemLabel: (item: TItem) => string;
  onChange: (id: string | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 text-xs font-medium uppercase text-muted-foreground">{label}</span>
      <FilterChip label={allLabel} isActive={!activeId} onClick={() => onChange(undefined)} />
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </>
      ) : (
        items.map((item) => (
          <FilterChip
            key={item.id}
            label={getItemLabel(item)}
            isActive={activeId === item.id}
            onClick={() => onChange(item.id)}
          />
        ))
      )}
    </div>
  );
}

function ProjectStatusBadge({ status }: { status: Project["status"] }) {
  const isPublished = status === "published";

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded px-2 py-1 text-xs font-medium capitalize",
        isPublished ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isPublished ? "bg-emerald-500" : "bg-muted-foreground",
        )}
      />
      {status}
    </span>
  );
}
