import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  ExternalLink,
  Github,
  GraduationCap,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";

import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { routes } from "@/constants/routes";
import { useCertifications, useEducation, useExperiences } from "@/features/experience";
import { useGitHubSummary } from "@/features/github";
import { usePublicSettings } from "@/features/settings";
import { useSkills } from "@/features/skills";

export function ProfilePage() {
  const settings = usePublicSettings();
  const experience = useExperiences();
  const education = useEducation();
  const certifications = useCertifications();
  const skills = useSkills({ pageSize: 12, sort: "sortOrder", order: "asc" });
  const github = useGitHubSummary(Boolean(settings.data?.githubUsername));

  if (settings.isLoading) return <ProfileSkeleton />;
  if (!settings.data) return <EmptyState title="Profile unavailable" />;
  const profile = settings.data;
  const imageUrl = profile.profileImageUrl ?? github.data?.profile.avatarUrl;

  return (
    <div className="min-h-[calc(100dvh-7rem)] bg-surface">
      <header className="grid border-b border-border lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col gap-5 p-4 sm:flex-row sm:p-6 lg:p-8">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${profile.profileName} profile`}
              className="h-32 w-32 shrink-0 rounded-md border border-border object-cover sm:h-40 sm:w-40"
            />
          ) : (
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-md border border-border bg-muted font-mono text-3xl text-primary sm:h-40 sm:w-40">
              {initials(profile.profileName)}
            </div>
          )}
          <div className="min-w-0 self-center">
            <p className="text-xs font-medium uppercase text-primary">Developer profile</p>
            <h1 className="mt-2 break-words text-3xl font-semibold text-foreground">
              {profile.profileName}
            </h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">{profile.profileRole}</p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              {profile.profileBiography}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-sm bg-muted px-2 py-1 text-xs text-foreground">
                <MapPin className="h-3.5 w-3.5" /> {profile.profileLocation}
              </span>
              <span className="flex items-center gap-1.5 rounded-sm bg-emerald-500/10 px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />{" "}
                {profile.availabilityStatus}
              </span>
            </div>
          </div>
        </div>
        <aside className="border-t border-border bg-muted/30 p-4 sm:p-6 lg:border-l lg:border-t-0">
          <p className="text-xs font-medium uppercase text-muted-foreground">Current focus</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-foreground">
            {profile.profileCurrentFocus}
          </p>
          <dl className="mt-6 space-y-4 border-t border-border pt-5 text-xs">
            <Stat label="Experience" value={`${experience.data?.length ?? 0} roles`} />
            <Stat label="Skills" value={`${skills.data?.meta.totalItems ?? 0} tracked`} />
            <Stat
              label="GitHub repos"
              value={String(github.data?.profile.publicRepositories ?? 0)}
            />
          </dl>
        </aside>
      </header>

      <section className="grid border-b border-border xl:grid-cols-2">
        <div className="p-4 sm:p-6 xl:border-r">
          <SectionTitle icon={<BookOpen className="h-4 w-4" />} title="Development philosophy" />
          <blockquote className="mt-4 border-l-2 border-primary pl-4 text-sm italic leading-7 text-muted-foreground">
            “{profile.profilePhilosophy}”
          </blockquote>
        </div>
        <div className="border-t border-border p-4 sm:p-6 xl:border-t-0">
          <SectionTitle icon={<Sparkles className="h-4 w-4" />} title="Favored stack" />
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.data?.items.map((skill) => (
              <Link
                key={skill.id}
                to={routes.skills}
                className="rounded-sm border border-border bg-background px-3 py-1.5 font-mono text-xs text-foreground hover:border-primary"
              >
                {skill.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid border-b border-border xl:grid-cols-2">
        <ProfileList
          title="Professional journey"
          icon={<BriefcaseBusiness className="h-4 w-4" />}
          href={routes.experience}
        >
          {experience.data?.slice(0, 3).map((item) => (
            <TimelineRow
              key={item.id}
              title={item.role}
              organization={item.company}
              date={formatRange(item.startDate, item.endDate, item.current)}
            />
          ))}
        </ProfileList>
        <ProfileList
          title="Education"
          icon={<GraduationCap className="h-4 w-4" />}
          href={routes.experience}
          className="border-t xl:border-l xl:border-t-0"
        >
          {education.data?.map((item) => (
            <TimelineRow
              key={item.id}
              title={item.degree}
              organization={item.institution}
              date={formatRange(item.startDate, item.endDate, item.current)}
            />
          ))}
        </ProfileList>
      </section>

      {profile.profileCertificationsVisible ? (
        <section className="p-4 sm:p-6">
          <SectionTitle icon={<Award className="h-4 w-4" />} title="Certifications" />
          {!certifications.isLoading && !certifications.data?.length ? (
            <div className="mt-4">
              <EmptyState title="No published certifications yet" />
            </div>
          ) : null}
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {certifications.data?.map((item) => (
              <article
                key={item.id}
                className="flex min-w-0 gap-3 rounded-md border border-border bg-background p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Award className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-semibold text-foreground">{item.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{item.issuer}</p>
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    {item.issuedAt ? formatDate(item.issuedAt) : "Issue date not specified"}
                  </p>
                  {item.credentialUrl || item.credentialMediaUrl ? (
                    <a
                      href={item.credentialUrl ?? item.credentialMediaUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary"
                    >
                      View credential <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {profile.githubUrl ? (
        <footer className="flex items-center justify-between gap-4 border-t border-border bg-muted/30 p-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Explore the public engineering record
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Repositories, activity, and project history.
            </p>
          </div>
          <a
            href={profile.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-2 text-sm font-medium text-primary"
          >
            <Github className="h-4 w-4" /> GitHub
          </a>
        </footer>
      ) : null}
    </div>
  );
}

function ProfileList({
  title,
  icon,
  href,
  className = "",
  children,
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`p-4 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <SectionTitle icon={icon} title={title} />
        <Link to={href} className="text-xs font-medium text-primary">
          View timeline
        </Link>
      </div>
      <div className="mt-4 divide-y divide-border border-y border-border">{children}</div>
    </div>
  );
}
function TimelineRow({
  title,
  organization,
  date,
}: {
  title: string;
  organization: string;
  date: string;
}) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{organization}</p>
      </div>
      <span className="font-mono text-xs text-muted-foreground">{date}</span>
    </div>
  );
}
function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <span className="text-primary">{icon}</span>
      {title}
    </h2>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono font-medium text-foreground">{value}</dd>
    </div>
  );
}
function ProfileSkeleton() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Skeleton className="h-64" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
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
function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short" }).format(
    new Date(`${value}T00:00:00`),
  );
}
function formatRange(start: string, end: string | null, current: boolean) {
  return `${new Date(`${start}T00:00:00`).getFullYear()} – ${current ? "Present" : end ? new Date(`${end}T00:00:00`).getFullYear() : "Present"}`;
}
