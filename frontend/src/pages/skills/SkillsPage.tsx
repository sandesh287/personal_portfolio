import { Layers3, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGroupedSkills } from "@/features/skills";
import type { Skill } from "@/features/skills";
import { cn } from "@/utils/cn";
import { getErrorMessage } from "@/utils/errors";

export function SkillsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const query = useGroupedSkills();
  const categories = Object.keys(query.data ?? {});
  const filteredGroups = useMemo<Record<string, Skill[]>>(() => {
    const term = search.trim().toLowerCase();
    return Object.fromEntries(
      Object.entries(query.data ?? {})
        .filter(([group]) => !category || group === category)
        .map(([group, skills]) => [
          group,
          skills.filter(
            (skill) =>
              !term ||
              skill.name.toLowerCase().includes(term) ||
              skill.description?.toLowerCase().includes(term),
          ),
        ])
        .filter(([, skills]) => skills.length > 0),
    ) as Record<string, Skill[]>;
  }, [category, query.data, search]);
  const visibleSkills = Object.values(filteredGroups).flat();

  return (
    <section className="min-h-[calc(100vh-8rem)] bg-surface">
      <header className="border-b border-border p-4 sm:p-6">
        <p className="text-xs font-medium uppercase text-muted-foreground">Technology Graph</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Skills Graph</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Explore Sandesh&apos;s frontend, mobile, data science, and engineering capabilities by
              domain and proficiency.
            </p>
          </div>
          <label className="relative w-full lg:max-w-sm">
            <span className="sr-only">Search skills</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search skills..."
              className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <FilterChip label="All" active={!category} onClick={() => setCategory(undefined)} />
          {categories.map((group) => (
            <FilterChip
              key={group}
              label={group}
              active={category === group}
              onClick={() => setCategory(group)}
            />
          ))}
        </div>
      </header>

      {query.isLoading ? <SkillsSkeleton /> : null}
      {query.isError ? (
        <div className="p-4 sm:p-6">
          <EmptyState
            title="Skills could not be loaded"
            description={getErrorMessage(query.error)}
          />
        </div>
      ) : null}
      {!query.isLoading && !query.isError && visibleSkills.length === 0 ? (
        <div className="p-4 sm:p-6">
          <EmptyState
            title="No skills found"
            description={
              search
                ? "Try another search term or category."
                : "Skills will appear here once added."
            }
          />
        </div>
      ) : null}

      {visibleSkills.length > 0 ? (
        <div className="grid min-h-[34rem] lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div
            className="min-w-0 border-b border-border p-4 sm:p-6 lg:border-b-0 lg:border-r"
            style={{
              backgroundImage:
                "radial-gradient(color-mix(in srgb, var(--border) 70%, transparent) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          >
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(filteredGroups).map(([group, skills]) => (
                <section key={group} className="min-w-0" aria-labelledby={`skill-group-${group}`}>
                  <div className="mb-3 flex items-center gap-2">
                    <Layers3 className="h-4 w-4 text-primary" aria-hidden="true" />
                    <h2
                      id={`skill-group-${group}`}
                      className="text-sm font-semibold text-foreground"
                    >
                      {group}
                    </h2>
                    <span className="text-xs text-muted-foreground">{skills.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {skills.map((skill) => (
                      <SkillNode
                        key={skill.id}
                        skill={skill}
                        selected={selectedSkill?.id === skill.id}
                        onSelect={() => setSelectedSkill(skill)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
          <SkillDetails
            skill={selectedSkill ?? visibleSkills[0] ?? null}
            onClose={() => setSelectedSkill(null)}
          />
        </div>
      ) : null}
    </section>
  );
}

function SkillNode({
  skill,
  selected,
  onSelect,
}: {
  skill: Skill;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex min-h-28 min-w-0 flex-col items-center justify-center gap-2 rounded-md border bg-background p-3 text-center transition-transform hover:scale-[1.02]",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/60",
      )}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface"
        style={{ color: skill.color ?? undefined }}
      >
        <SkillIcon identifier={skill.icon} />
      </span>
      <span className="max-w-full break-words text-sm font-medium text-foreground">
        {skill.name}
      </span>
      <LevelDots level={skill.level} />
    </button>
  );
}

function SkillDetails({ skill, onClose }: { skill: Skill | null; onClose: () => void }) {
  if (!skill) return null;
  return (
    <aside className="bg-background p-4 sm:p-6 lg:sticky lg:top-0 lg:self-start">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-primary">
            <SkillIcon identifier={skill.icon} />
          </span>
          <div className="min-w-0">
            <h2 className="break-words text-lg font-semibold text-foreground">{skill.name}</h2>
            <p className="text-xs font-medium uppercase text-primary">{skill.category}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
          onClick={onClose}
        >
          Close details
        </Button>
      </div>
      <div className="mt-6">
        <p className="text-xs font-medium uppercase text-muted-foreground">Proficiency</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <LevelDots level={skill.level} large />
          <span className="text-sm font-semibold text-foreground">{levelLabel(skill.level)}</span>
        </div>
      </div>
      <p className="mt-6 text-sm leading-6 text-muted-foreground">
        {skill.description ?? "Capability details are being documented."}
      </p>
      {skill.technologyId ? (
        <p className="mt-6 rounded-md border border-border bg-surface p-3 text-xs text-muted-foreground">
          Linked to the canonical project technology catalog.
        </p>
      ) : null}
    </aside>
  );
}

function LevelDots({ level, large = false }: { level: number; large?: boolean }) {
  return (
    <span className="inline-flex gap-1" aria-label={`Proficiency level ${level} of 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "rounded-full",
            large ? "h-2.5 w-2.5" : "h-1.5 w-1.5",
            index < level ? "bg-primary" : "bg-muted",
          )}
        />
      ))}
    </span>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 shrink-0 rounded-full border px-3 text-xs font-medium sm:h-8",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function SkillsSkeleton() {
  return (
    <div
      className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-4"
      aria-label="Loading skills graph"
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-32 w-full" />
      ))}
    </div>
  );
}

function levelLabel(level: number) {
  return ["Foundation", "Working", "Proficient", "Advanced", "Expert"][level - 1] ?? "Unknown";
}
