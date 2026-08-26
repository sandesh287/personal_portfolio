import {
  ArrowRight,
  BookOpen,
  Code2,
  Download,
  ExternalLink,
  FolderCode,
  Github,
  Mail,
  MapPin,
  Sparkles,
  Star,
} from "lucide-react";
import { Link } from "react-router";

import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFeaturedBlogPosts } from "@/features/blog";
import { useExperiences } from "@/features/experience";
import { useGitHubSummary } from "@/features/github";
import { useFeaturedProjects } from "@/features/projects";
import type { Project } from "@/features/projects";
import { resumeApi } from "@/features/resume";
import { usePublicSettings } from "@/features/settings";
import { useSkills } from "@/features/skills";
import { routes } from "@/constants/routes";
import { getResponsiveImageAttributes } from "@/utils/cloudinaryImage";

const launchers = [
  {
    label: "Projects",
    description: "Builds and case studies",
    href: routes.projects,
    icon: FolderCode,
  },
  { label: "Notes", description: "Engineering knowledge base", href: routes.blog, icon: BookOpen },
  {
    label: "Skills",
    description: "Technology capability graph",
    href: routes.skills,
    icon: Sparkles,
  },
  { label: "GitHub", description: "Repositories and activity", href: routes.github, icon: Github },
];

export function HomePage() {
  const settings = usePublicSettings();
  const projects = useFeaturedProjects({ limit: 3 });
  const notes = useFeaturedBlogPosts({ limit: 3 });
  const skills = useSkills({ pageSize: 8, sort: "sortOrder", order: "asc" });
  const experiences = useExperiences();
  const githubEnabled = Boolean(settings.data?.homeGithubVisible && settings.data.githubUsername);
  const github = useGitHubSummary(githubEnabled);

  if (settings.isLoading) return <HomeSkeleton />;
  if (!settings.data)
    return (
      <EmptyState
        title="Workspace unavailable"
        description="Public workspace settings could not be loaded."
      />
    );

  const visibility = settings.data;
  const currentExperience =
    experiences.data?.find((item) => item.current) ?? experiences.data?.[0] ?? null;

  return (
    <div className="min-h-[calc(100dvh-7rem)] bg-surface">
      {visibility.homeProfileVisible ? (
        <ProfileWorkspace
          name={visibility.profileName}
          role={visibility.profileRole}
          tagline={visibility.tagline}
          availability={visibility.availabilityStatus}
          avatarUrl={github.data?.profile.avatarUrl}
          location={github.data?.profile.location}
        />
      ) : null}

      {visibility.homeQuickLinksVisible ? (
        <section className="border-b border-border px-4 py-5 sm:px-6">
          <SectionHeader
            eyebrow="Workspace index"
            title="Open a workspace"
            href={routes.projects}
            linkLabel="Explore all"
          />
          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4">
            {launchers.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="group min-w-0 bg-background p-4 hover:bg-muted/60 sm:p-5"
              >
                <item.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="mt-5 text-sm font-semibold text-foreground">{item.label}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                <ArrowRight
                  className="mt-4 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {visibility.homeProjectsVisible ? (
        <section className="border-b border-border px-4 py-6 sm:px-6">
          <SectionHeader
            eyebrow="Selected work"
            title="Featured projects"
            href={routes.projects}
            linkLabel="Project Explorer"
          />
          {projects.isLoading ? <RowSkeleton /> : null}
          {!projects.isLoading && !projects.data?.length ? (
            <div className="mt-4">
              <EmptyState
                title="No featured projects yet"
                description="Published featured projects will appear here."
              />
            </div>
          ) : null}
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {projects.data?.map((project) => (
              <ProjectPreview key={project.id} project={project} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid xl:grid-cols-2">
        {visibility.homeNotesVisible ? (
          <section className="border-b border-border px-4 py-6 sm:px-6 xl:border-r">
            <SectionHeader
              eyebrow="Knowledge base"
              title="Engineering notes"
              href={routes.blog}
              linkLabel="All notes"
            />
            <div className="mt-4 divide-y divide-border border-y border-border">
              {notes.data?.map((note) => (
                <Link
                  key={note.id}
                  to={`/blog/${note.slug}`}
                  className="group grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">
                      {note.title}
                    </span>
                    <span className="mt-1 block line-clamp-1 text-xs text-muted-foreground">
                      {note.excerpt}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {note.readingTimeMinutes} min
                  </span>
                </Link>
              ))}
              {!notes.isLoading && !notes.data?.length ? (
                <p className="py-5 text-sm text-muted-foreground">No featured notes yet.</p>
              ) : null}
              {notes.isLoading ? <RowSkeleton /> : null}
            </div>
          </section>
        ) : null}

        {visibility.homeSkillsVisible ? (
          <section className="border-b border-border px-4 py-6 sm:px-6">
            <SectionHeader
              eyebrow="Capability map"
              title="Technical focus"
              href={routes.skills}
              linkLabel="Skills Graph"
            />
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {skills.data?.items.map((skill) => (
                <Link
                  key={skill.id}
                  to={routes.skills}
                  className="min-w-0 rounded-md border border-border bg-background p-3 hover:border-primary/50 hover:bg-muted/40"
                >
                  <Code2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  <p className="mt-3 truncate text-sm font-medium text-foreground">{skill.name}</p>
                  <div className="mt-3 flex gap-1" aria-label={`Level ${skill.level} of 5`}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <span
                        key={level}
                        className={`h-1 flex-1 rounded-sm ${level <= skill.level ? "bg-primary" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {visibility.homeExperienceVisible || visibility.homeGithubVisible ? (
        <section className="grid border-b border-border xl:grid-cols-[minmax(0,1fr)_22rem]">
          {visibility.homeExperienceVisible ? (
            <div className="px-4 py-6 sm:px-6 xl:border-r">
              <SectionHeader
                eyebrow="Current context"
                title="Experience"
                href={routes.experience}
                linkLabel="Timeline"
              />
              {currentExperience ? (
                <div className="mt-4 border-l-2 border-primary pl-4">
                  <p className="text-xs font-medium uppercase text-primary">
                    {currentExperience.current ? "Current role" : "Latest role"}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">
                    {currentExperience.role}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{currentExperience.company}</p>
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {currentExperience.summary}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentExperience.technologies.slice(0, 6).map((item) => (
                      <span
                        key={item}
                        className="rounded-sm bg-muted px-2 py-1 font-mono text-xs text-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState title="Experience is being prepared" />
                </div>
              )}
            </div>
          ) : null}
          {visibility.homeGithubVisible ? (
            <GitHubStatus enabled={githubEnabled} query={github} />
          ) : null}
        </section>
      ) : null}

      <footer className="flex flex-col gap-3 bg-muted/30 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-semibold text-foreground">{visibility.availabilityStatus}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Open the communication terminal to start a conversation.
          </p>
        </div>
        <Link
          to={routes.contact}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          <Mail className="h-4 w-4" /> Contact Sandesh
        </Link>
      </footer>
    </div>
  );
}

function ProfileWorkspace({
  name,
  role,
  tagline,
  availability,
  avatarUrl,
  location,
}: {
  name: string;
  role: string;
  tagline: string;
  availability: string;
  avatarUrl?: string;
  location?: string | null;
}) {
  return (
    <section className="grid border-b border-border lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${name} profile`}
              className="h-24 w-24 shrink-0 rounded-md border border-border object-cover sm:h-28 sm:w-28"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md border border-border bg-muted font-mono text-2xl font-semibold text-primary sm:h-28 sm:w-28">
              {initials(name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase text-primary">{role}</p>
            <h1 className="mt-2 break-words text-3xl font-semibold text-foreground sm:text-4xl">
              Hello, I&apos;m {name.split(" ")[0]}.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {tagline}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={resumeApi.downloadUrl}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                <Download className="h-4 w-4" /> Resume
              </a>
              <Link
                to={routes.contact}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Mail className="h-4 w-4" /> Contact
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-7 overflow-x-auto rounded-md bg-[#15171c] p-4 font-mono text-xs leading-6 text-[#d9dde7] sm:text-sm">
          <pre>
            <code>
              <span className="text-[#8b90a0]">const</span> developer = {`{`}
              <br /> name: <span className="text-[#74c991]">&quot;{name}&quot;</span>,<br /> focus:
              [<span className="text-[#74c991]">&quot;React&quot;</span>,{" "}
              <span className="text-[#74c991]">&quot;Flutter&quot;</span>,{" "}
              <span className="text-[#74c991]">&quot;Data Science&quot;</span>],
              <br /> status: <span className="text-[#74c991]">&quot;building&quot;</span>
              <br />
              {`}`};
            </code>
          </pre>
        </div>
      </div>
      <aside className="border-t border-border bg-muted/30 p-4 sm:p-6 lg:border-l lg:border-t-0">
        <p className="text-xs font-medium uppercase text-muted-foreground">Developer status</p>
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> {availability}
        </div>
        {location ? (
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-4 w-4" /> {location}
          </p>
        ) : null}
        <dl className="mt-6 space-y-4 border-t border-border pt-5 text-xs">
          <div>
            <dt className="text-muted-foreground">Primary interface</dt>
            <dd className="mt-1 font-medium text-foreground">React + TypeScript</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Mobile runtime</dt>
            <dd className="mt-1 font-medium text-foreground">Flutter + Dart</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Research track</dt>
            <dd className="mt-1 font-medium text-foreground">Data Science</dd>
          </div>
        </dl>
      </aside>
    </section>
  );
}

function ProjectPreview({ project }: { project: Project }) {
  const cover =
    project.images.find((image) => image.id === project.coverImageId) ?? project.images[0];
  const image = cover?.url
    ? getResponsiveImageAttributes(cover.url, {
        widths: [480, 720, 960],
        sizes: "(min-width: 1024px) 30vw, 100vw",
        imageWidth: cover.imageWidth,
        imageHeight: cover.imageHeight,
        placeholderUrl: cover.placeholderUrl,
      })
    : null;
  return (
    <Link
      to={`/projects/${project.slug}`}
      className="group overflow-hidden rounded-md border border-border bg-background"
    >
      <div className="aspect-[16/9] overflow-hidden bg-muted">
        {image ? (
          <img
            {...image}
            alt={cover?.caption ?? `${project.title} preview`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FolderCode className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
            {project.title}
          </h3>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {project.summary}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.technologies.slice(0, 3).map((technology) => (
            <span
              key={technology.id}
              className="rounded-sm bg-muted px-2 py-1 font-mono text-[11px] text-foreground"
            >
              {technology.name}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function GitHubStatus({
  enabled,
  query,
}: {
  enabled: boolean;
  query: ReturnType<typeof useGitHubSummary>;
}) {
  return (
    <aside className="bg-muted/30 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase text-muted-foreground">GitHub telemetry</p>
        <Github className="h-4 w-4 text-primary" />
      </div>
      {!enabled ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Configure a GitHub username to activate telemetry.
        </p>
      ) : query.isLoading ? (
        <Skeleton className="mt-4 h-28" />
      ) : query.data ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xl font-semibold text-foreground">{query.data.stats.totalStars}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3" /> Stars
              </p>
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">
                {query.data.stats.recentCommits}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Recent commits</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 border-t border-border pt-4">
            {query.data.recentActivity.slice(0, 3).map((event) => (
              <a
                key={event.id}
                href={event.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="block min-w-0"
              >
                <p className="truncate font-mono text-xs text-primary">{event.repositoryName}</p>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{event.summary}</p>
              </a>
            ))}
          </div>
          <Link
            to={routes.github}
            className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-primary"
          >
            Open GitHub Explorer <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          GitHub telemetry is temporarily unavailable.
        </p>
      )}
    </aside>
  );
}

function SectionHeader({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <header className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
      </div>
      <Link to={href} className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </header>
  );
}
function RowSkeleton() {
  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-44" />
      ))}
    </div>
  );
}
function HomeSkeleton() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Skeleton className="h-80" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
