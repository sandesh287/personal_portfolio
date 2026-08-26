import {
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Code2,
  ExternalLink,
  Github,
  ImageIcon,
  Smartphone,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { routes } from "@/constants/routes";
import { useProjects } from "@/features/projects";
import type { Project } from "@/features/projects";
import { cn } from "@/utils/cn";
import { getResponsiveImageAttributes } from "@/utils/cloudinaryImage";
import { getErrorMessage } from "@/utils/errors";

export type LabKind = "ai" | "flutter";

const LAB_CONFIG = {
  ai: {
    eyebrow: "Research environment",
    title: "AI Lab",
    description:
      "Data science studies, machine learning experiments, and reproducible research work.",
    emptyTitle: "No experiments published",
    emptyDescription:
      "Publish a project in the AI Lab or Data Science Projects category to populate this workspace.",
    categorySlugs: new Set<string>(["ai-lab", "data-science-projects"]),
    icon: BrainCircuit,
  },
  flutter: {
    eyebrow: "Cross-platform workspace",
    title: "Flutter Device Lab",
    description:
      "Mobile applications presented through a focused device testing and inspection workspace.",
    emptyTitle: "No Flutter applications published",
    emptyDescription:
      "Publish a project in the Flutter Applications category to populate this workspace.",
    categorySlugs: new Set<string>(["flutter-applications"]),
    icon: Smartphone,
  },
} as const;

export function LabWorkspacePage({ kind }: { kind: LabKind }) {
  const config = LAB_CONFIG[kind];
  const { data, error, isError, isLoading } = useProjects({
    page: 1,
    pageSize: 100,
    sort: "sortOrder",
    order: "asc",
  });
  const projects = useMemo(
    () =>
      (data?.items ?? []).filter(
        (project) => project.category && config.categorySlugs.has(project.category.slug),
      ),
    [config.categorySlugs, data?.items],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedProject = projects.find((project) => project.id === selectedId) ?? projects[0];

  useEffect(() => {
    if (projects.length > 0 && !projects.some((project) => project.id === selectedId)) {
      setSelectedId(projects[0].id);
    }
  }, [projects, selectedId]);

  if (isLoading) {
    return <LabSkeleton />;
  }

  if (isError) {
    return (
      <div className="p-4">
        <EmptyState
          title={`${config.title} could not be loaded`}
          description={getErrorMessage(error, "Check that the backend is running and try again.")}
        />
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="p-4">
        <EmptyState title={config.emptyTitle} description={config.emptyDescription} />
      </div>
    );
  }

  return (
    <section className="min-h-[calc(100vh-8rem)] bg-surface">
      <LabHeader kind={kind} projectCount={projects.length} />
      <div className="grid min-h-[calc(100vh-13rem)] lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_19rem]">
        <ProjectExplorer
          projects={projects}
          selectedId={selectedProject.id}
          onSelect={setSelectedId}
        />
        <LabWorkbench kind={kind} project={selectedProject} />
        <ProjectInspector project={selectedProject} />
      </div>
    </section>
  );
}

function LabHeader({ kind, projectCount }: { kind: LabKind; projectCount: number }) {
  const config = LAB_CONFIG[kind];
  const Icon = config.icon;

  return (
    <header className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-muted-foreground">{config.eyebrow}</p>
          <h1 className="mt-1 break-words text-xl font-semibold text-foreground">{config.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>
      <span className="shrink-0 rounded border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
        {projectCount} {projectCount === 1 ? "project" : "projects"}
      </span>
    </header>
  );
}

function ProjectExplorer({
  projects,
  selectedId,
  onSelect,
}: {
  projects: Project[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="border-b border-border bg-background lg:border-b-0 lg:border-r">
      <p className="px-4 pt-4 text-xs font-medium uppercase text-muted-foreground">Explorer</p>
      <nav
        className="flex gap-1 overflow-x-auto p-3 lg:block lg:space-y-1"
        aria-label="Lab projects"
      >
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => onSelect(project.id)}
            aria-current={selectedId === project.id ? "page" : undefined}
            className={cn(
              "flex min-h-11 min-w-52 items-center gap-2 rounded-md border px-3 text-left text-sm transition-colors lg:min-w-0 lg:w-full",
              selectedId === project.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Code2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">{project.title}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function LabWorkbench({ kind, project }: { kind: LabKind; project: Project }) {
  return (
    <main className="min-w-0 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase text-primary">
              {kind === "ai" ? "Active experiment" : "Active build"}
            </p>
            <h2 className="mt-2 break-words text-2xl font-semibold text-foreground">
              {project.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.summary}</p>
          </div>
          <Link
            to={routes.projectDetails.replace(":slug", project.slug)}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Full case study <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {kind === "flutter" ? (
          <DevicePreview project={project} />
        ) : (
          <ResearchPreview project={project} />
        )}
      </div>
    </main>
  );
}

function ResearchPreview({ project }: { project: Project }) {
  const cover = getCover(project);

  return (
    <div className="mt-6 space-y-5">
      <section className="rounded-md border border-border bg-background p-4 sm:p-5">
        <p className="text-xs font-medium uppercase text-muted-foreground">Research notes</p>
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-foreground">
          {project.description || project.summary}
        </p>
      </section>
      <MediaPreview project={project} cover={cover} label="Experiment output" />
    </div>
  );
}

function DevicePreview({ project }: { project: Project }) {
  const cover = getCover(project);

  return (
    <div className="mt-6">
      <p className="mb-3 text-center text-xs font-medium uppercase text-muted-foreground">
        Responsive device preview
      </p>
      <div className="mx-auto w-full max-w-[19rem] rounded-[2rem] border-[8px] border-foreground bg-background p-2 shadow-lg sm:max-w-[22rem]">
        <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-foreground" />
        <div className="aspect-[9/16] overflow-hidden rounded-[1.25rem] bg-muted">
          {cover?.url ? (
            <img
              {...getResponsiveImageAttributes(cover.url, {
                widths: [320, 640, 960],
                sizes: "(min-width: 640px) 352px, calc(100vw - 5rem)",
                imageWidth: cover.imageWidth,
                imageHeight: cover.imageHeight,
                placeholderUrl: cover.placeholderUrl,
              })}
              alt={`${project.title} application preview`}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
              <Smartphone className="h-10 w-10" aria-hidden="true" />
              <p className="text-sm">Add a project cover image to activate the device preview.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MediaPreview({
  project,
  cover,
  label,
}: {
  project: Project;
  cover: ReturnType<typeof getCover>;
  label: string;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-border bg-background">
      <p className="border-b border-border px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <div className="aspect-video bg-muted">
        {cover?.url ? (
          <img
            {...getResponsiveImageAttributes(cover.url, {
              widths: [640, 960, 1440],
              sizes: "(min-width: 1280px) 56vw, (min-width: 1024px) 70vw, 100vw",
              imageWidth: cover.imageWidth,
              imageHeight: cover.imageHeight,
              placeholderUrl: cover.placeholderUrl,
            })}
            alt={`${project.title} output`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="h-5 w-5" aria-hidden="true" /> No output media attached
          </div>
        )}
      </div>
    </section>
  );
}

function ProjectInspector({ project }: { project: Project }) {
  return (
    <aside className="border-t border-border bg-background p-4 xl:border-l xl:border-t-0">
      <p className="text-xs font-medium uppercase text-muted-foreground">Project inspector</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-1">
        <InspectorItem label="Category" value={project.category?.name ?? "Uncategorized"} />
        <InspectorItem label="Updated" value={formatDate(project.updatedAt)} />
        <InspectorItem label="Images" value={String(project.images.length)} />
        <InspectorItem label="Videos" value={String(project.videos.length)} />
      </dl>

      <section className="mt-6">
        <h3 className="text-xs font-medium uppercase text-muted-foreground">Technology stack</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.technologies.map((technology) => (
            <span
              key={technology.id}
              className="rounded border border-border bg-surface px-2 py-1 text-xs text-foreground"
            >
              {technology.name}
            </span>
          ))}
        </div>
      </section>

      <div className="mt-6 space-y-2 border-t border-border pt-4">
        {project.repositoryUrl ? (
          <ExternalAction href={project.repositoryUrl} label="Source repository" icon={Github} />
        ) : null}
        {project.liveUrl ? (
          <ExternalAction href={project.liveUrl} label="Live application" icon={ExternalLink} />
        ) : null}
        <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" /> Published project
        </div>
      </div>
    </aside>
  );
}

function InspectorItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function ExternalAction({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Github;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex min-h-10 items-center gap-2 text-sm text-foreground hover:text-primary"
    >
      <Icon className="h-4 w-4" aria-hidden="true" /> {label}
    </a>
  );
}

function LabSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-label="Loading lab workspace">
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-[32rem] w-full" />
      </div>
    </div>
  );
}

function getCover(project: Project) {
  return (
    project.images.find((image) => image.mediaAssetId === project.coverImageId) ?? project.images[0]
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
