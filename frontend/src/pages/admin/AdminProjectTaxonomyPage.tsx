import { zodResolver } from "@hookform/resolvers/zod";
import { Edit3, Layers3, Plus, RefreshCw, Tags, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState } from "@/components/common/EmptyState";
import { FormActions } from "@/components/form/FormActions";
import { FormField, TextInput } from "@/components/form/FormField";
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
  useCreateProjectCategory,
  useCreateTechnology,
  useDeleteProjectCategory,
  useDeleteTechnology,
  useProjectCategories,
  useTechnologies,
  useUpdateProjectCategory,
  useUpdateTechnology,
} from "@/features/projects";
import type {
  ProjectCategory,
  ProjectCategoryCreatePayload,
  Technology,
  TechnologyCreatePayload,
} from "@/features/projects";
import { getErrorMessage } from "@/utils/errors";

type TaxonomyMode = "categories" | "technologies";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(120),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

const technologySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(120),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  category: z.string().min(2, "Category is required.").max(80),
  icon: z.string().max(120).optional(),
  color: z.string().max(32).optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

type CategoryFormValues = z.infer<typeof categorySchema>;
type CategoryFormInput = z.input<typeof categorySchema>;
type TechnologyFormValues = z.infer<typeof technologySchema>;
type TechnologyFormInput = z.input<typeof technologySchema>;

interface AdminProjectTaxonomyPageProps {
  mode: TaxonomyMode;
}

export function AdminProjectTaxonomyPage({ mode }: AdminProjectTaxonomyPageProps) {
  return mode === "categories" ? <AdminCategoriesSection /> : <AdminTechnologiesSection />;
}

function AdminCategoriesSection() {
  const categoriesQuery = useProjectCategories();
  const deleteCategory = useDeleteProjectCategory();
  const [editingCategory, setEditingCategory] = useState<ProjectCategory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  async function handleDelete(category: ProjectCategory) {
    const confirmed = window.confirm(`Delete ${category.name}?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteCategory.mutateAsync(category.id);
      toast.success("Project category deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Project category could not be deleted."));
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Project Categories</CardTitle>
          <CardDescription>Organize projects into major portfolio sections.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => void categoriesQuery.refetch()}
            isLoading={categoriesQuery.isFetching}
          >
            Refresh
          </Button>
          <Button
            type="button"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingCategory(null);
              setIsFormOpen(true);
            }}
          >
            New category
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {categoriesQuery.isLoading ? <TaxonomySkeleton /> : null}
        {categoriesQuery.isError ? (
          <EmptyState
            title="Categories could not be loaded"
            description={getErrorMessage(categoriesQuery.error)}
          />
        ) : null}
        {categoriesQuery.data?.length === 0 ? (
          <EmptyState title="No categories yet" description="Create the first project category." />
        ) : null}
        {categoriesQuery.data && categoriesQuery.data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Sort</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesQuery.data.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Tags className="h-4 w-4 text-primary" aria-hidden="true" />
                      <span className="font-medium text-foreground">{category.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>{category.sortOrder}</TableCell>
                  <TableCell className="max-w-md text-muted-foreground">
                    {category.description ?? "No description"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        leftIcon={<Edit3 className="h-4 w-4" />}
                        onClick={() => {
                          setEditingCategory(category);
                          setIsFormOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        onClick={() => void handleDelete(category)}
                        isLoading={deleteCategory.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </CardContent>

      <CategoryFormModal
        category={editingCategory}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </Card>
  );
}

function AdminTechnologiesSection() {
  const technologiesQuery = useTechnologies();
  const deleteTechnology = useDeleteTechnology();
  const [editingTechnology, setEditingTechnology] = useState<Technology | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  async function handleDelete(technology: Technology) {
    const confirmed = window.confirm(`Delete ${technology.name}?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteTechnology.mutateAsync(technology.id);
      toast.success("Technology deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Technology could not be deleted."));
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Technologies</CardTitle>
          <CardDescription>Manage reusable stack tags used by Projects.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => void technologiesQuery.refetch()}
            isLoading={technologiesQuery.isFetching}
          >
            Refresh
          </Button>
          <Button
            type="button"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingTechnology(null);
              setIsFormOpen(true);
            }}
          >
            New technology
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {technologiesQuery.isLoading ? <TaxonomySkeleton /> : null}
        {technologiesQuery.isError ? (
          <EmptyState
            title="Technologies could not be loaded"
            description={getErrorMessage(technologiesQuery.error)}
          />
        ) : null}
        {technologiesQuery.data?.length === 0 ? (
          <EmptyState title="No technologies yet" description="Create the first stack tag." />
        ) : null}
        {technologiesQuery.data && technologiesQuery.data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Sort</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technologiesQuery.data.map((technology) => (
                <TableRow key={technology.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Layers3 className="h-4 w-4 text-primary" aria-hidden="true" />
                      <span className="font-medium text-foreground">{technology.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{technology.slug}</TableCell>
                  <TableCell>{technology.category}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full border border-border"
                        style={{ backgroundColor: technology.color ?? "transparent" }}
                      />
                      {technology.color ?? "Unset"}
                    </span>
                  </TableCell>
                  <TableCell>{technology.sortOrder}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        leftIcon={<Edit3 className="h-4 w-4" />}
                        onClick={() => {
                          setEditingTechnology(technology);
                          setIsFormOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        onClick={() => void handleDelete(technology)}
                        isLoading={deleteTechnology.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </CardContent>

      <TechnologyFormModal
        technology={editingTechnology}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </Card>
  );
}

function CategoryFormModal({
  category,
  isOpen,
  onClose,
}: {
  category: ProjectCategory | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const createCategory = useCreateProjectCategory();
  const updateCategory = useUpdateProjectCategory(category?.id ?? "");
  const isSubmitting = createCategory.isPending || updateCategory.isPending;

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: getCategoryDefaults(category),
  });

  useEffect(() => {
    if (isOpen) {
      reset(getCategoryDefaults(category));
    }
  }, [category, isOpen, reset]);

  async function onSubmit(values: CategoryFormValues) {
    const payload: ProjectCategoryCreatePayload = {
      name: values.name,
      slug: values.slug,
      description: values.description?.trim() || null,
      sortOrder: values.sortOrder,
    };

    try {
      if (category) {
        await updateCategory.mutateAsync(payload);
        toast.success("Project category updated.");
      } else {
        await createCategory.mutateAsync(payload);
        toast.success("Project category created.");
      }
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Project category could not be saved."));
    }
  }

  return (
    <Modal
      title={category ? "Edit category" : "Create category"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <FormField label="Name" error={errors.name?.message}>
          <TextInput {...register("name")} hasError={Boolean(errors.name)} />
        </FormField>
        <FormField label="Slug" error={errors.slug?.message}>
          <TextInput {...register("slug")} hasError={Boolean(errors.slug)} />
        </FormField>
        <FormField label="Description" error={errors.description?.message}>
          <Textarea {...register("description")} hasError={Boolean(errors.description)} />
        </FormField>
        <FormField label="Sort order" error={errors.sortOrder?.message}>
          <TextInput type="number" min={0} {...register("sortOrder")} />
        </FormField>
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {category ? "Save changes" : "Create category"}
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}

function TechnologyFormModal({
  technology,
  isOpen,
  onClose,
}: {
  technology: Technology | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const createTechnology = useCreateTechnology();
  const updateTechnology = useUpdateTechnology(technology?.id ?? "");
  const isSubmitting = createTechnology.isPending || updateTechnology.isPending;

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<TechnologyFormInput, unknown, TechnologyFormValues>({
    resolver: zodResolver(technologySchema),
    defaultValues: getTechnologyDefaults(technology),
  });

  useEffect(() => {
    if (isOpen) {
      reset(getTechnologyDefaults(technology));
    }
  }, [isOpen, reset, technology]);

  async function onSubmit(values: TechnologyFormValues) {
    const payload: TechnologyCreatePayload = {
      name: values.name,
      slug: values.slug,
      category: values.category,
      icon: values.icon?.trim() || null,
      color: values.color?.trim() || null,
      sortOrder: values.sortOrder,
    };

    try {
      if (technology) {
        await updateTechnology.mutateAsync(payload);
        toast.success("Technology updated.");
      } else {
        await createTechnology.mutateAsync(payload);
        toast.success("Technology created.");
      }
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Technology could not be saved."));
    }
  }

  return (
    <Modal
      title={technology ? "Edit technology" : "Create technology"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" error={errors.name?.message}>
            <TextInput {...register("name")} hasError={Boolean(errors.name)} />
          </FormField>
          <FormField label="Slug" error={errors.slug?.message}>
            <TextInput {...register("slug")} hasError={Boolean(errors.slug)} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Category" error={errors.category?.message}>
            <TextInput {...register("category")} hasError={Boolean(errors.category)} />
          </FormField>
          <FormField label="Sort order" error={errors.sortOrder?.message}>
            <TextInput type="number" min={0} {...register("sortOrder")} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Icon" error={errors.icon?.message}>
            <TextInput {...register("icon")} hasError={Boolean(errors.icon)} />
          </FormField>
          <FormField label="Color" error={errors.color?.message}>
            <TextInput placeholder="#0058bc" {...register("color")} hasError={Boolean(errors.color)} />
          </FormField>
        </div>
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {technology ? "Save changes" : "Create technology"}
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}

function TaxonomySkeleton() {
  return (
    <div className="space-y-2" aria-label="Loading taxonomy records">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

function getCategoryDefaults(category: ProjectCategory | null): CategoryFormInput {
  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    sortOrder: category?.sortOrder ?? 0,
  };
}

function getTechnologyDefaults(technology: Technology | null): TechnologyFormInput {
  return {
    name: technology?.name ?? "",
    slug: technology?.slug ?? "",
    category: technology?.category ?? "",
    icon: technology?.icon ?? "",
    color: technology?.color ?? "",
    sortOrder: technology?.sortOrder ?? 0,
  };
}
