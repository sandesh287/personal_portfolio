import { ArrowLeft, CalendarDays, Code2, ExternalLink, Github, Layers3 } from "lucide-react";
import { Link, useParams } from "react-router";

import { EmptyState } from "@/components/common/EmptyState";
import { SeoMetadata } from "@/components/common/SeoMetadata";
import { Skeleton } from "@/components/ui/Skeleton";
import { routes } from "@/constants/routes";
import { ProjectMediaGallery } from "@/features/projects/components/ProjectMediaGallery";
import { useProjectDetails } from "@/features/projects";
import type { Project } from "@/features/projects";
import { cn } from "@/utils/cn";
import { getResponsiveImageAttributes } from "@/utils/cloudinaryImage";
import { getErrorMessage } from "@/utils/errors";

export function ProjectDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, error, isError, isLoading } = useProjectDetails(slug);
  const seoImage = project
    ? (project.images.find((image) => image.mediaAssetId === project.coverImageId)?.url ??
      project.images[0]?.url)
    : null;

  const seo = project ? (
    <SeoMetadata
      title={`${project.title} | Sandesh`}
      description={project.summary}
      path={routes.projectDetails.replace(":slug", project.slug)}
      image={seoImage}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: project.title,
        description: project.summary,
        url: new URL(
          routes.projectDetails.replace(":slug", project.slug),
          window.location.origin,
        ).toString(),
        keywords: project.technologies.map((technology) => technology.name),
      }}
    />
  ) : null;

  if (isLoading) {
    return (
      <>
        {seo}
        <ProjectDetailsSkeleton />
      </>
    );
  }

  if (isError) {
    return (
      <section className="min-h-[calc(100vh-8rem)] p-4">
        {seo}
        <Link
          to={routes.projects}
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to projects
        </Link>
        <EmptyState
          title="Project could not be opened"
          description={getErrorMessage(error, "The requested project was not found.")}
        />
      </section>
    );
  }

  if (!project) {
    return (
      <section className="min-h-[calc(100vh-8rem)] p-4">
        {seo}
        <EmptyState title="Project not found" description="No project exists for this route." />
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-8rem)] bg-surface">
      {seo}
      <header className="border-b border-border p-4">
        <Link
          to={routes.projects}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to projects
        </Link>
      </header>

      <div className="grid min-h-[calc(100vh-11rem)] lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="border-b border-border bg-background p-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Layers3 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{project.title}</p>
              <p className="text-xs text-muted-foreground">ProjectOS module</p>
            </div>
          </div>

          <nav
            className="mt-4 flex gap-1 overflow-x-auto pb-1 lg:mt-6 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0"
            aria-label="Project sections"
          >
            {["Overview", "Tech Stack", "Details", "Media"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="flex h-10 shrink-0 items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:h-9"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-3 lg:mt-6 lg:block lg:space-y-2">
            <ProjectLink href={project.liveUrl} label="Launch demo" icon="external" isPrimary />
            <ProjectLink href={project.repositoryUrl} label="View source" icon="github" />
            <ProjectLink href={project.caseStudyUrl} label="Read case study" icon="external" />
          </div>
        </aside>

        <main className="min-w-0 overflow-hidden">
          <ProjectHero project={project} />
          <ProjectTechStack project={project} />
          <ProjectDetails project={project} />
          <ProjectMediaGallery project={project} />
        </main>
      </div>
    </section>
  );
}

function ProjectHero({ project }: { project: Project }) {
  const heroImage =
    project.images.find((image) => image.mediaAssetId === project.coverImageId) ??
    project.images[0];
  const heroImageAttributes = heroImage?.url
    ? getResponsiveImageAttributes(heroImage.url, {
        widths: [480, 768, 1024, 1440, 1920],
        sizes:
          "(min-width: 1280px) calc(100vw - 38rem), (min-width: 1024px) calc(100vw - 34rem), calc(100vw - 3rem)",
        imageWidth: heroImage.imageWidth,
        imageHeight: heroImage.imageHeight,
        placeholderUrl: heroImage.placeholderUrl,
      })
    : null;

  return (
    <section id="overview" className="scroll-mt-16 border-b border-border p-4 lg:p-6">
      <div className="overflow-hidden rounded-md border border-border bg-background">
        {heroImageAttributes ? (
          <img
            {...heroImageAttributes}
            alt={`${project.title} cover`}
            fetchPriority="high"
            decoding="async"
            className="aspect-video max-h-96 w-full object-cover"
          />
        ) : (
          <div className="flex aspect-video max-h-96 min-h-48 items-center justify-center bg-muted">
            <div className="grid h-32 w-52 grid-cols-4 gap-2 rounded-md border border-border bg-surface p-3 sm:h-40 sm:w-64">
              {Array.from({ length: 16 }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "rounded border border-border",
                    index % 3 === 0 ? "bg-primary/30" : "bg-background",
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill project={project} />
            {project.category ? (
              <span className="rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {project.category.name}
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 break-words text-2xl font-semibold text-foreground sm:text-3xl">
            {project.title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            {project.summary}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {project.liveUrl ? (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Launch
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}
          {project.repositoryUrl ? (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-muted px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              Source
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ProjectTechStack({ project }: { project: Project }) {
  return (
    <section id="tech-stack" className="scroll-mt-16 border-b border-border p-4 lg:p-6">
      <h2 className="text-xl font-semibold text-foreground">Tech Stack</h2>
      {project.technologies.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {project.technologies.map((technology) => (
            <div
              key={technology.id}
              className="flex items-center gap-3 rounded-md border border-border bg-background p-3"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded bg-muted text-primary"
                style={technology.color ? { color: technology.color } : undefined}
              >
                <Code2 className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{technology.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{technology.category}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No technologies attached" />
      )}
    </section>
  );
}

function ProjectDetails({ project }: { project: Project }) {
  return (
    <section
      id="details"
      className="grid scroll-mt-16 gap-4 border-b border-border p-4 lg:grid-cols-3 lg:p-6"
    >
      <div className="lg:col-span-2">
        <h2 className="text-xl font-semibold text-foreground">Details</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
          {project.description ?? project.summary}
        </p>
      </div>

      <dl className="grid gap-3 rounded-md border border-border bg-background p-4">
        <MetadataItem label="Status" value={project.status} />
        <MetadataItem label="Featured" value={project.featured ? "Yes" : "No"} />
        <MetadataItem label="Published" value={formatDate(project.publishedAt)} />
        <MetadataItem label="Updated" value={formatDate(project.updatedAt)} />
      </dl>
    </section>
  );
}

function ProjectDetailsSkeleton() {
  return (
    <section className="min-h-[calc(100vh-8rem)] p-4" aria-label="Loading project details">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-64 w-full" />
      <Skeleton className="mt-6 h-8 w-1/2" />
      <Skeleton className="mt-3 h-5 w-3/4" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    </section>
  );
}

function ProjectLink({
  href,
  label,
  icon,
  isPrimary = false,
}: {
  href: string | null;
  label: string;
  icon: "external" | "github";
  isPrimary?: boolean;
}) {
  const Icon = icon === "github" ? Github : ExternalLink;

  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
        isPrimary
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-border bg-surface text-foreground hover:bg-muted",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </a>
  );
}

function StatusPill({ project }: { project: Project }) {
  return (
    <span className="inline-flex items-center gap-2 rounded bg-emerald-500/10 px-2 py-1 text-xs font-medium capitalize text-emerald-500">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {project.status}
    </span>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium text-foreground">{value}</dd>
      </div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
