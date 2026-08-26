import { zodResolver } from "@hookform/resolvers/zod";
import { BriefcaseBusiness, Edit3, GraduationCap, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEventHandler, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState } from "@/components/common/EmptyState";
import { FormActions } from "@/components/form/FormActions";
import { FormField, TextInput } from "@/components/form/FormField";
import { Textarea } from "@/components/form/Textarea";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useCreateEducation,
  useCreateExperience,
  useDeleteEducation,
  useDeleteExperience,
  useEducation,
  useExperiences,
  useUpdateEducation,
  useUpdateExperience,
} from "@/features/experience";
import type {
  Education,
  EducationMutationPayload,
  Experience,
  ExperienceMutationPayload,
} from "@/features/experience";
import { cn } from "@/utils/cn";
import { getErrorMessage } from "@/utils/errors";

const sharedSchema = {
  location: z.string().max(180),
  startDate: z.string().min(1, "Start date is required."),
  endDate: z.string(),
  current: z.boolean(),
  achievements: z.string(),
  sortOrder: z.coerce.number().int().min(0),
  published: z.boolean(),
};

const experienceSchema = z.object({
  company: z.string().min(2).max(180),
  role: z.string().min(2).max(180),
  employmentType: z.string().max(80),
  summary: z.string().min(2).max(4000),
  technologies: z.string(),
  companyUrl: z.string().max(1000),
  ...sharedSchema,
});

const educationSchema = z.object({
  institution: z.string().min(2).max(180),
  degree: z.string().min(2).max(180),
  fieldOfStudy: z.string().max(180),
  description: z.string().max(4000),
  institutionUrl: z.string().max(1000),
  ...sharedSchema,
});

type ExperienceInput = z.input<typeof experienceSchema>;
type ExperienceValues = z.output<typeof experienceSchema>;
type EducationInput = z.input<typeof educationSchema>;
type EducationValues = z.output<typeof educationSchema>;

export function AdminExperiencePage() {
  const [mode, setMode] = useState<"experience" | "education">("experience");
  const [search, setSearch] = useState("");
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const experiences = useExperiences(search.trim() || undefined, true);
  const education = useEducation(search.trim() || undefined, true);
  const deleteExperience = useDeleteExperience();
  const deleteEducation = useDeleteEducation();
  const activeQuery = mode === "experience" ? experiences : education;

  function openCreate() {
    setEditingExperience(null);
    setEditingEducation(null);
    setIsFormOpen(true);
  }

  async function handleDelete(entry: Experience | Education) {
    const label = mode === "experience" ? (entry as Experience).role : (entry as Education).degree;
    if (!window.confirm(`Delete ${label}?`)) return;
    try {
      if (mode === "experience") await deleteExperience.mutateAsync(entry.id);
      else await deleteEducation.mutateAsync(entry.id);
      toast.success(`${mode === "experience" ? "Experience" : "Education"} deleted.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">Developer profile</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Timeline management</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Maintain professional experience and education shown in the public workspace.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={openCreate}>
          New {mode}
        </Button>
      </header>

      <section className="overflow-hidden rounded-md border border-border bg-background">
        <header className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex rounded-md bg-muted p-1">
            <ModeButton
              label="Experience"
              icon={<BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />}
              active={mode === "experience"}
              onClick={() => setMode("experience")}
            />
            <ModeButton
              label="Education"
              icon={<GraduationCap className="h-4 w-4" aria-hidden="true" />}
              active={mode === "education"}
              onClick={() => setMode("education")}
            />
          </div>
          <label className="relative w-full lg:max-w-sm">
            <span className="sr-only">Search timeline records</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search records..."
              className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </header>

        <div className="p-4">
          {activeQuery.isLoading ? <AdminTimelineSkeleton /> : null}
          {activeQuery.isError ? (
            <EmptyState
              title="Timeline records could not be loaded"
              description={getErrorMessage(activeQuery.error)}
            />
          ) : null}
          {activeQuery.data?.length === 0 ? (
            <EmptyState
              title={`No ${mode} records found`}
              description={`Create the first ${mode} record.`}
            />
          ) : null}
          {mode === "experience" && experiences.data?.length ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {experiences.data.map((entry) => (
                <AdminTimelineCard
                  key={entry.id}
                  title={entry.role}
                  organization={entry.company}
                  entry={entry}
                  onEdit={() => {
                    setEditingExperience(entry);
                    setIsFormOpen(true);
                  }}
                  onDelete={() => void handleDelete(entry)}
                />
              ))}
            </div>
          ) : null}
          {mode === "education" && education.data?.length ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {education.data.map((entry) => (
                <AdminTimelineCard
                  key={entry.id}
                  title={entry.degree}
                  organization={entry.institution}
                  entry={entry}
                  onEdit={() => {
                    setEditingEducation(entry);
                    setIsFormOpen(true);
                  }}
                  onDelete={() => void handleDelete(entry)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {mode === "experience" ? (
        <ExperienceFormModal
          isOpen={isFormOpen}
          entry={editingExperience}
          onClose={() => setIsFormOpen(false)}
        />
      ) : (
        <EducationFormModal
          isOpen={isFormOpen}
          entry={editingEducation}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}

function AdminTimelineCard({
  title,
  organization,
  entry,
  onEdit,
  onDelete,
}: {
  title: string;
  organization: string;
  entry: Experience | Education;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-md border border-border bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words font-semibold text-foreground">{title}</h2>
            <span
              className={
                entry.published
                  ? "rounded bg-emerald-500/10 px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400"
                  : "rounded bg-muted px-2 py-1 text-xs text-muted-foreground"
              }
            >
              {entry.published ? "Published" : "Draft"}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-primary">{organization}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {entry.startDate} - {entry.current ? "Present" : (entry.endDate ?? "Present")}
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            leftIcon={<Edit3 className="h-4 w-4" aria-hidden="true" />}
            onClick={onEdit}
          >
            Edit record
          </Button>
          <Button
            variant="ghost"
            size="icon"
            leftIcon={<Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />}
            onClick={onDelete}
          >
            Delete record
          </Button>
        </div>
      </div>
    </article>
  );
}

function ExperienceFormModal({
  isOpen,
  entry,
  onClose,
}: {
  isOpen: boolean;
  entry: Experience | null;
  onClose: () => void;
}) {
  const createEntry = useCreateExperience();
  const updateEntry = useUpdateExperience(entry?.id ?? "");
  const isSubmitting = createEntry.isPending || updateEntry.isPending;
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<ExperienceInput, unknown, ExperienceValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: experienceDefaults(entry),
  });
  const current = watch("current");
  useEffect(() => {
    if (isOpen) reset(experienceDefaults(entry));
  }, [entry, isOpen, reset]);

  async function onSubmit(values: ExperienceValues) {
    const payload: ExperienceMutationPayload = {
      company: values.company.trim(),
      role: values.role.trim(),
      employmentType: values.employmentType.trim() || null,
      location: values.location.trim() || null,
      startDate: values.startDate,
      endDate: values.current ? null : values.endDate || null,
      current: values.current,
      summary: values.summary.trim(),
      achievements: parseLines(values.achievements),
      technologies: parseCommaList(values.technologies),
      companyUrl: values.companyUrl.trim() || null,
      sortOrder: values.sortOrder,
      published: values.published,
    };
    try {
      if (entry) await updateEntry.mutateAsync(payload);
      else await createEntry.mutateAsync(payload);
      toast.success(`Experience ${entry ? "updated" : "created"}.`);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <TimelineFormModal
      title={entry ? "Edit experience" : "Create experience"}
      isOpen={isOpen}
      onClose={onClose}
      isSubmitting={isSubmitting}
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      submitLabel={entry ? "Save changes" : "Create experience"}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Company" error={errors.company?.message}>
          <TextInput {...register("company")} hasError={Boolean(errors.company)} />
        </FormField>
        <FormField label="Role" error={errors.role?.message}>
          <TextInput {...register("role")} hasError={Boolean(errors.role)} />
        </FormField>
        <FormField label="Employment type">
          <TextInput {...register("employmentType")} placeholder="Full-time" />
        </FormField>
        <FormField label="Location">
          <TextInput {...register("location")} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Start date" error={errors.startDate?.message}>
          <TextInput type="date" {...register("startDate")} />
        </FormField>
        <FormField label="End date" error={errors.endDate?.message}>
          <TextInput type="date" disabled={current} {...register("endDate")} />
        </FormField>
      </div>
      <FormField label="Summary" error={errors.summary?.message}>
        <Textarea {...register("summary")} hasError={Boolean(errors.summary)} />
      </FormField>
      <FormField label="Achievements" description="One achievement per line.">
        <Textarea {...register("achievements")} />
      </FormField>
      <FormField label="Technologies" description="Comma-separated labels.">
        <TextInput {...register("technologies")} />
      </FormField>
      <FormField label="Company URL">
        <TextInput type="url" {...register("companyUrl")} />
      </FormField>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm">
          <input type="checkbox" {...register("current")} className="accent-primary" />
          Current
        </label>
        <label className="flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm">
          <input type="checkbox" {...register("published")} className="accent-primary" />
          Published
        </label>
        <FormField label="Sort order">
          <TextInput type="number" min={0} {...register("sortOrder")} />
        </FormField>
      </div>
    </TimelineFormModal>
  );
}

function EducationFormModal({
  isOpen,
  entry,
  onClose,
}: {
  isOpen: boolean;
  entry: Education | null;
  onClose: () => void;
}) {
  const createEntry = useCreateEducation();
  const updateEntry = useUpdateEducation(entry?.id ?? "");
  const isSubmitting = createEntry.isPending || updateEntry.isPending;
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<EducationInput, unknown, EducationValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: educationDefaults(entry),
  });
  const current = watch("current");
  useEffect(() => {
    if (isOpen) reset(educationDefaults(entry));
  }, [entry, isOpen, reset]);

  async function onSubmit(values: EducationValues) {
    const payload: EducationMutationPayload = {
      institution: values.institution.trim(),
      degree: values.degree.trim(),
      fieldOfStudy: values.fieldOfStudy.trim() || null,
      location: values.location.trim() || null,
      startDate: values.startDate,
      endDate: values.current ? null : values.endDate || null,
      current: values.current,
      description: values.description.trim() || null,
      achievements: parseLines(values.achievements),
      institutionUrl: values.institutionUrl.trim() || null,
      sortOrder: values.sortOrder,
      published: values.published,
    };
    try {
      if (entry) await updateEntry.mutateAsync(payload);
      else await createEntry.mutateAsync(payload);
      toast.success(`Education ${entry ? "updated" : "created"}.`);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <TimelineFormModal
      title={entry ? "Edit education" : "Create education"}
      isOpen={isOpen}
      onClose={onClose}
      isSubmitting={isSubmitting}
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      submitLabel={entry ? "Save changes" : "Create education"}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Institution" error={errors.institution?.message}>
          <TextInput {...register("institution")} hasError={Boolean(errors.institution)} />
        </FormField>
        <FormField label="Degree" error={errors.degree?.message}>
          <TextInput {...register("degree")} hasError={Boolean(errors.degree)} />
        </FormField>
        <FormField label="Field of study">
          <TextInput {...register("fieldOfStudy")} />
        </FormField>
        <FormField label="Location">
          <TextInput {...register("location")} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Start date" error={errors.startDate?.message}>
          <TextInput type="date" {...register("startDate")} />
        </FormField>
        <FormField label="End date" error={errors.endDate?.message}>
          <TextInput type="date" disabled={current} {...register("endDate")} />
        </FormField>
      </div>
      <FormField label="Description">
        <Textarea {...register("description")} />
      </FormField>
      <FormField label="Achievements" description="One achievement per line.">
        <Textarea {...register("achievements")} />
      </FormField>
      <FormField label="Institution URL">
        <TextInput type="url" {...register("institutionUrl")} />
      </FormField>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm">
          <input type="checkbox" {...register("current")} className="accent-primary" />
          Current
        </label>
        <label className="flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm">
          <input type="checkbox" {...register("published")} className="accent-primary" />
          Published
        </label>
        <FormField label="Sort order">
          <TextInput type="number" min={0} {...register("sortOrder")} />
        </FormField>
      </div>
    </TimelineFormModal>
  );
}

function TimelineFormModal({
  title,
  isOpen,
  onClose,
  isSubmitting,
  onSubmit,
  submitLabel,
  children,
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitLabel: string;
  children: ReactNode;
}) {
  return (
    <Modal
      title={title}
      description="Timeline fields are hidden publicly until published."
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        {children}
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}

function ModeButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded px-3 text-sm",
        active
          ? "bg-background font-medium text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function AdminTimelineSkeleton() {
  return (
    <div className="grid gap-3 xl:grid-cols-2" aria-label="Loading timeline records">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-32 w-full" />
      ))}
    </div>
  );
}
function parseLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
function parseCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
function sharedDefaults(entry: Experience | Education | null) {
  return {
    location: entry?.location ?? "",
    startDate: entry?.startDate ?? "",
    endDate: entry?.endDate ?? "",
    current: entry?.current ?? false,
    achievements: entry?.achievements.join("\n") ?? "",
    sortOrder: entry?.sortOrder ?? 0,
    published: entry?.published ?? false,
  };
}
function experienceDefaults(entry: Experience | null): ExperienceInput {
  return {
    ...sharedDefaults(entry),
    company: entry?.company ?? "",
    role: entry?.role ?? "",
    employmentType: entry?.employmentType ?? "",
    summary: entry?.summary ?? "",
    technologies: entry?.technologies.join(", ") ?? "",
    companyUrl: entry?.companyUrl ?? "",
  };
}
function educationDefaults(entry: Education | null): EducationInput {
  return {
    ...sharedDefaults(entry),
    institution: entry?.institution ?? "",
    degree: entry?.degree ?? "",
    fieldOfStudy: entry?.fieldOfStudy ?? "",
    description: entry?.description ?? "",
    institutionUrl: entry?.institutionUrl ?? "",
  };
}
