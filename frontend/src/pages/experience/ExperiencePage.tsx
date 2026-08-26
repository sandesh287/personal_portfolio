import { BriefcaseBusiness, ExternalLink, GraduationCap, MapPin, Search } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useEducation, useExperiences } from "@/features/experience";
import type { Education, Experience } from "@/features/experience";
import { getErrorMessage } from "@/utils/errors";

export function ExperiencePage() {
  const [search, setSearch] = useState("");
  const querySearch = search.trim() || undefined;
  const experiences = useExperiences(querySearch);
  const education = useEducation(querySearch);
  const isLoading = experiences.isLoading || education.isLoading;
  const isError = experiences.isError || education.isError;
  const hasEntries = Boolean(experiences.data?.length || education.data?.length);

  return (
    <section className="min-h-[calc(100vh-8rem)] bg-surface">
      <header className="border-b border-border p-4 sm:p-6">
        <p className="text-xs font-medium uppercase text-muted-foreground">Developer Profile</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Experience Explorer</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Sandesh&apos;s engineering trajectory, technical contributions, and continuing data
              science education.
            </p>
          </div>
          <label className="relative w-full lg:max-w-sm">
            <span className="sr-only">Search experience and education</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search timeline..."
              className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
      </header>

      <div className="space-y-8 p-4 sm:p-6">
        {isLoading ? <TimelineSkeleton /> : null}
        {isError ? (
          <EmptyState
            title="The developer timeline could not be loaded"
            description={getErrorMessage(experiences.error ?? education.error)}
          />
        ) : null}
        {!isLoading && !isError && !hasEntries ? (
          <EmptyState
            title="No timeline entries found"
            description={
              search ? "Try another search term." : "Published experience will appear here."
            }
          />
        ) : null}

        {experiences.data?.length ? (
          <TimelineSection
            title="Engineering experience"
            icon={<BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />}
          >
            {experiences.data.map((entry) => (
              <ExperienceCard key={entry.id} entry={entry} />
            ))}
          </TimelineSection>
        ) : null}

        {education.data?.length ? (
          <TimelineSection
            title="Education"
            icon={<GraduationCap className="h-5 w-5" aria-hidden="true" />}
          >
            {education.data.map((entry) => (
              <EducationCard key={entry.id} entry={entry} />
            ))}
          </TimelineSection>
        ) : null}
      </div>
    </section>
  );
}

function TimelineSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={title.replaceAll(" ", "-").toLowerCase()}>
      <div className="mb-4 flex items-center gap-2 text-primary">
        {icon}
        <h2
          id={title.replaceAll(" ", "-").toLowerCase()}
          className="text-base font-semibold text-foreground"
        >
          {title}
        </h2>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">{children}</div>
    </section>
  );
}

function ExperienceCard({ entry }: { entry: Experience }) {
  return (
    <article className="flex min-w-0 flex-col rounded-md border border-border bg-background p-4 transition-colors hover:border-primary/50 sm:p-5">
      <TimelineHeader
        title={entry.role}
        organization={entry.company}
        startDate={entry.startDate}
        endDate={entry.endDate}
        current={entry.current}
        location={entry.location}
        url={entry.companyUrl}
      />
      {entry.technologies.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {entry.technologies.map((technology) => (
            <span
              key={technology}
              className="rounded border border-border bg-surface px-2 py-1 text-xs text-muted-foreground"
            >
              {technology}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{entry.summary}</p>
      <AchievementList items={entry.achievements} />
    </article>
  );
}

function EducationCard({ entry }: { entry: Education }) {
  return (
    <article className="flex min-w-0 flex-col rounded-md border border-border bg-background p-4 transition-colors hover:border-primary/50 sm:p-5">
      <TimelineHeader
        title={entry.degree}
        organization={
          entry.fieldOfStudy ? `${entry.institution}, ${entry.fieldOfStudy}` : entry.institution
        }
        startDate={entry.startDate}
        endDate={entry.endDate}
        current={entry.current}
        location={entry.location}
        url={entry.institutionUrl}
      />
      {entry.description ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{entry.description}</p>
      ) : null}
      <AchievementList items={entry.achievements} />
    </article>
  );
}

function TimelineHeader({
  title,
  organization,
  startDate,
  endDate,
  current,
  location,
  url,
}: {
  title: string;
  organization: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  location: string | null;
  url: string | null;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h3 className="break-words text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 break-words text-sm font-medium text-primary">{organization}</p>
        {location ? (
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {location}
          </p>
        ) : null}
      </div>
      <div className="shrink-0 text-left sm:text-right">
        <p className="text-xs font-medium text-muted-foreground">
          {formatMonth(startDate)} -{" "}
          {current ? "Present" : endDate ? formatMonth(endDate) : "Present"}
        </p>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex min-h-9 items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Visit
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </header>
  );
}

function AchievementList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-4 space-y-2 border-t border-border pt-4">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
          <span
            className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function TimelineSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-2" aria-label="Loading developer timeline">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-64 w-full" />
      ))}
    </div>
  );
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}
