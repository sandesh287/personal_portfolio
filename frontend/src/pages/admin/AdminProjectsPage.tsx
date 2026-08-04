import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit3,
  FolderKanban,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState } from "@/components/common/EmptyState";
import { FormActions } from "@/components/form/FormActions";
import { FormField, TextInput } from "@/components/form/FormField";
import { SelectField } from "@/components/form/SelectField";
import { Textarea } from "@/components/form/Textarea";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  useCreateProject,
  useDeleteProject,
  useProjectCategories,
  useProjects,
  useTechnologies,
  useUpdateProject,
} from "@/features/projects";
import type {
  Project,
  ProjectCategory,
  ProjectCreatePayload,
  ProjectStatus,
  Technology,
} from "@/features/projects";
import { cn } from "@/utils/cn";
import { getErrorMessage } from "@/utils/errors";

const ADMIN_PAGE_SIZE = 10;

const projectFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters.").max(180),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  summary: z.string().min(2, "Summary is required.").max(500),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  technologyIds: z.array(z.string()).default([]),
  repositoryUrl: z.string().url("Enter a valid URL.").or(z.literal("")).optional(),
  liveUrl: z.string().url("Enter a valid URL.").or(z.literal("")).optional(),
  caseStudyUrl: z.string().url("Enter a valid URL.").or(z.literal("")).optional(),
  status: z.enum(["draft", "published", "archived"]),
  featured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;
type ProjectFormInput = z.input<typeof projectFormSchema>;

const statusOptions: ProjectStatus[] = ["published", "draft", "archived"];

export function AdminProjectsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("published");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const queryParams = {
    page,
    pageSize: ADMIN_PAGE_SIZE,
    search: search.trim() || undefined,
    status,
    sort: "updatedAt" as const,
    order: "desc" as const,
  };

  const projectsQuery = useProjects(queryParams);
  const categoriesQuery = useProjectCategories();
  const technologiesQuery = useTechnologies();
  const deleteProject = useDeleteProject();

  const projects = useMemo(() => projectsQuery.data?.items ?? [], [projectsQuery.data?.items]);
  const meta = projectsQuery.data?.meta;

  function openCreateForm() {
    setEditingProject(null);
    setIsFormOpen(true);
  }

  function openEditForm(project: Project) {
    setEditingProject(project);
    setIsFormOpen(true);
  }

  async function handleDelete(project: Project) {
    const confirmed = window.confirm(`Delete ${project.title}?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteProject.mutateAsync(project.id);
      toast.success("Project deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Project could not be deleted."));
    }
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Projects Admin</CardTitle>
            <CardDescription>
              Manage project records before media workflows are added to the dashboard.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => void projectsQuery.refetch()}
              isLoading={projectsQuery.isFetching}
            >
              Refresh
            </Button>
            <Button type="button" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateForm}>
              New project
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem]">
            <label className="relative">
              <span className="sr-only">Search admin projects</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <TextInput
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search projects..."
                className="pl-9"
              />
            </label>
            <SelectField
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as ProjectStatus);
                setPage(1);
              }}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option[0].toUpperCase()}
                  {option.slice(1)}
                </option>
              ))}
            </SelectField>
          </div>

          {projectsQuery.isError ? (
            <EmptyState
              title="Projects could not be loaded"
              description={getErrorMessage(
                projectsQuery.error,
                "Check your admin session and backend connection.",
              )}
            />
          ) : null}

          {projectsQuery.isLoading ? <AdminProjectsSkeleton /> : null}

          {!projectsQuery.isLoading && !projectsQuery.isError && projects.length === 0 ? (
            <EmptyState
              title="No projects in this status"
              description="Create a project or choose a different status filter."
            />
          ) : null}

          {!projectsQuery.isLoading && !projectsQuery.isError && projects.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <FolderKanban className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{project.title}</p>
                            <p className="text-xs text-muted-foreground">{project.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{project.category?.name ?? "Unassigned"}</TableCell>
                      <TableCell>
                        <StatusBadge status={project.status} />
                      </TableCell>
                      <TableCell>{project.featured ? "Yes" : "No"}</TableCell>
                      <TableCell>{formatDate(project.updatedAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditForm(project)}
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit project
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => void handleDelete(project)}
                            isLoading={deleteProject.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete project
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {meta ? (
                <footer className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {meta.page} of {meta.totalPages || 1}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!meta.hasPreviousPage}
                      onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
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
            </>
          ) : null}
        </CardContent>
      </Card>

      <ProjectFormModal
        project={editingProject}
        categories={categoriesQuery.data ?? []}
        technologies={technologiesQuery.data ?? []}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </section>
  );
}

function ProjectFormModal({
  project,
  categories,
  technologies,
  isOpen,
  onClose,
}: {
  project: Project | null;
  categories: ProjectCategory[];
  technologies: Technology[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject(project?.id ?? "");
  const isEditing = Boolean(project);
  const isSubmitting = createProject.isPending || updateProject.isPending;

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<ProjectFormInput, unknown, ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: getDefaultValues(project),
  });

  const selectedTechnologyIds = watch("technologyIds") ?? [];

  useEffect(() => {
    if (isOpen) {
      reset(getDefaultValues(project));
    }
  }, [isOpen, project, reset]);

  async function onSubmit(values: ProjectFormValues) {
    const payload: ProjectCreatePayload = {
      title: values.title,
      slug: values.slug,
      summary: values.summary,
      description: values.description?.trim() || null,
      categoryId: values.categoryId || null,
      technologyIds: values.technologyIds,
      repositoryUrl: values.repositoryUrl || null,
      liveUrl: values.liveUrl || null,
      caseStudyUrl: values.caseStudyUrl || null,
      status: values.status,
      featured: values.featured,
      sortOrder: values.sortOrder,
    };

    try {
      if (project) {
        await updateProject.mutateAsync(payload);
        toast.success("Project updated.");
      } else {
        await createProject.mutateAsync(payload);
        toast.success("Project created.");
      }

      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Project could not be saved."));
    }
  }

  return (
    <Modal
      title={isEditing ? "Edit project" : "Create project"}
      description="Core project fields only. Media management will be added as a separate workflow."
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl"
    >
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Title" error={errors.title?.message}>
            <TextInput {...register("title")} hasError={Boolean(errors.title)} />
          </FormField>
          <FormField label="Slug" error={errors.slug?.message}>
            <TextInput {...register("slug")} hasError={Boolean(errors.slug)} />
          </FormField>
        </div>

        <FormField label="Summary" error={errors.summary?.message}>
          <Textarea {...register("summary")} hasError={Boolean(errors.summary)} />
        </FormField>

        <FormField label="Description" error={errors.description?.message}>
          <Textarea {...register("description")} hasError={Boolean(errors.description)} />
        </FormField>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Category" error={errors.categoryId?.message}>
            <SelectField {...register("categoryId")}>
              <option value="">Unassigned</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </SelectField>
          </FormField>
          <FormField label="Status" error={errors.status?.message}>
            <SelectField {...register("status")}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option[0].toUpperCase()}
                  {option.slice(1)}
                </option>
              ))}
            </SelectField>
          </FormField>
          <FormField label="Sort order" error={errors.sortOrder?.message}>
            <TextInput type="number" min={0} {...register("sortOrder")} />
          </FormField>
        </div>

        <fieldset className="rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-medium text-foreground">Technologies</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {technologies.map((technology) => (
              <label
                key={technology.id}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm",
                  selectedTechnologyIds.includes(technology.id)
                    ? "border-primary text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <input
                  type="checkbox"
                  value={technology.id}
                  className="h-4 w-4 accent-primary"
                  {...register("technologyIds")}
                />
                {technology.name}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Repository URL" error={errors.repositoryUrl?.message}>
            <TextInput {...register("repositoryUrl")} hasError={Boolean(errors.repositoryUrl)} />
          </FormField>
          <FormField label="Live URL" error={errors.liveUrl?.message}>
            <TextInput {...register("liveUrl")} hasError={Boolean(errors.liveUrl)} />
          </FormField>
          <FormField label="Case study URL" error={errors.caseStudyUrl?.message}>
            <TextInput {...register("caseStudyUrl")} hasError={Boolean(errors.caseStudyUrl)} />
          </FormField>
        </div>

        <label className="flex items-center gap-2 rounded-md border border-border bg-background p-3 text-sm text-foreground">
          <input type="checkbox" className="h-4 w-4 accent-primary" {...register("featured")} />
          Featured project
        </label>

        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            leftIcon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
          >
            {isEditing ? "Save changes" : "Create project"}
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}

function AdminProjectsSkeleton() {
  return (
    <div className="space-y-2" aria-label="Loading admin projects">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className="inline-flex rounded bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
      {status}
    </span>
  );
}

function getDefaultValues(project: Project | null): ProjectFormValues {
  return {
    title: project?.title ?? "",
    slug: project?.slug ?? "",
    summary: project?.summary ?? "",
    description: project?.description ?? "",
    categoryId: project?.category?.id ?? "",
    technologyIds: project?.technologies.map((technology) => technology.id) ?? [],
    repositoryUrl: project?.repositoryUrl ?? "",
    liveUrl: project?.liveUrl ?? "",
    caseStudyUrl: project?.caseStudyUrl ?? "",
    status: project?.status ?? "draft",
    featured: project?.featured ?? false,
    sortOrder: project?.sortOrder ?? 0,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
