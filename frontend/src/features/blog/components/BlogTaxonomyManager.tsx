import { zodResolver } from "@hookform/resolvers/zod";
import { Edit3, Plus, Tags, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  useBlogCategories,
  useBlogTags,
  useCreateBlogCategory,
  useCreateBlogTag,
  useDeleteBlogCategory,
  useDeleteBlogTag,
  useUpdateBlogCategory,
  useUpdateBlogTag,
} from "@/features/blog/hooks";
import type { BlogCategory, BlogTag } from "@/features/blog/types";
import { getErrorMessage } from "@/utils/errors";

const slugSchema = z
  .string()
  .min(2, "Slug must be at least 2 characters.")
  .max(140)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens.");

const categorySchema = z.object({
  name: z.string().min(2).max(120),
  slug: slugSchema,
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0),
});

const tagSchema = z.object({
  name: z.string().min(2).max(80),
  slug: slugSchema,
  color: z.string().max(32).optional(),
});

type CategoryInput = z.input<typeof categorySchema>;
type CategoryValues = z.output<typeof categorySchema>;
type TagValues = z.infer<typeof tagSchema>;

export function BlogTaxonomyManager() {
  const [mode, setMode] = useState<"categories" | "tags">("categories");

  return (
    <section className="rounded-md border border-border bg-background">
      <header className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Content taxonomy</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize notes with reusable categories and topics.
          </p>
        </div>
        <div className="flex rounded-md bg-muted p-1" aria-label="Taxonomy type">
          <TaxonomyModeButton
            label="Categories"
            active={mode === "categories"}
            onClick={() => setMode("categories")}
          />
          <TaxonomyModeButton
            label="Topics"
            active={mode === "tags"}
            onClick={() => setMode("tags")}
          />
        </div>
      </header>
      {mode === "categories" ? <CategoriesManager /> : <TagsManager />}
    </section>
  );
}

function CategoriesManager() {
  const query = useBlogCategories();
  const deleteCategory = useDeleteBlogCategory();
  const [editing, setEditing] = useState<BlogCategory | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  async function handleDelete(category: BlogCategory) {
    if (!window.confirm(`Delete category ${category.name}?`)) return;
    try {
      await deleteCategory.mutateAsync(category.id);
      toast.success("Blog category deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Blog category could not be deleted."));
    }
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-end">
        <Button
          type="button"
          leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
          onClick={() => {
            setEditing(null);
            setIsOpen(true);
          }}
        >
          New category
        </Button>
      </div>
      {query.isLoading ? <TaxonomySkeleton /> : null}
      {query.isError ? (
        <EmptyState
          title="Categories could not be loaded"
          description={getErrorMessage(query.error)}
        />
      ) : null}
      {query.data?.length === 0 ? (
        <EmptyState title="No blog categories yet" description="Create the first category." />
      ) : null}
      {query.data?.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{category.name}</p>
                    {category.description ? (
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {category.description}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell>{category.sortOrder}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      leftIcon={<Edit3 className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => {
                        setEditing(category);
                        setIsOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
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
      <CategoryModal category={editing} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}

function TagsManager() {
  const query = useBlogTags();
  const deleteTag = useDeleteBlogTag();
  const [editing, setEditing] = useState<BlogTag | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  async function handleDelete(tag: BlogTag) {
    if (!window.confirm(`Delete topic ${tag.name}?`)) return;
    try {
      await deleteTag.mutateAsync(tag.id);
      toast.success("Blog topic deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Blog topic could not be deleted."));
    }
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-end">
        <Button
          type="button"
          leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
          onClick={() => {
            setEditing(null);
            setIsOpen(true);
          }}
        >
          New topic
        </Button>
      </div>
      {query.isLoading ? <TaxonomySkeleton /> : null}
      {query.isError ? (
        <EmptyState title="Topics could not be loaded" description={getErrorMessage(query.error)} />
      ) : null}
      {query.data?.length === 0 ? (
        <EmptyState title="No blog topics yet" description="Create the first reusable topic." />
      ) : null}
      {query.data?.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Color</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell>
                  <span className="inline-flex items-center gap-2 font-medium text-foreground">
                    <Tags className="h-4 w-4 text-primary" aria-hidden="true" />
                    {tag.name}
                  </span>
                </TableCell>
                <TableCell>{tag.slug}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full border border-border"
                      style={{ backgroundColor: tag.color ?? "transparent" }}
                    />
                    {tag.color ?? "Unset"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      leftIcon={<Edit3 className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => {
                        setEditing(tag);
                        setIsOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => void handleDelete(tag)}
                      isLoading={deleteTag.isPending}
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
      <TagModal tag={editing} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}

function CategoryModal({
  category,
  isOpen,
  onClose,
}: {
  category: BlogCategory | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const createCategory = useCreateBlogCategory();
  const updateCategory = useUpdateBlogCategory(category?.id ?? "");
  const isSubmitting = createCategory.isPending || updateCategory.isPending;
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CategoryInput, unknown, CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: categoryDefaults(category),
  });

  useEffect(() => {
    if (isOpen) reset(categoryDefaults(category));
  }, [category, isOpen, reset]);

  async function onSubmit(values: CategoryValues) {
    try {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        description: values.description?.trim() || null,
        sortOrder: values.sortOrder,
      };
      if (category) {
        await updateCategory.mutateAsync(payload);
        toast.success("Blog category updated.");
      } else {
        await createCategory.mutateAsync(payload);
        toast.success("Blog category created.");
      }
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Blog category could not be saved."));
    }
  }

  return (
    <Modal
      title={category ? "Edit blog category" : "Create blog category"}
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

function TagModal({
  tag,
  isOpen,
  onClose,
}: {
  tag: BlogTag | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const createTag = useCreateBlogTag();
  const updateTag = useUpdateBlogTag(tag?.id ?? "");
  const isSubmitting = createTag.isPending || updateTag.isPending;
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<TagValues>({ resolver: zodResolver(tagSchema), defaultValues: tagDefaults(tag) });

  useEffect(() => {
    if (isOpen) reset(tagDefaults(tag));
  }, [isOpen, reset, tag]);

  async function onSubmit(values: TagValues) {
    try {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        color: values.color?.trim() || null,
      };
      if (tag) {
        await updateTag.mutateAsync(payload);
        toast.success("Blog topic updated.");
      } else {
        await createTag.mutateAsync(payload);
        toast.success("Blog topic created.");
      }
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Blog topic could not be saved."));
    }
  }

  return (
    <Modal title={tag ? "Edit blog topic" : "Create blog topic"} isOpen={isOpen} onClose={onClose}>
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <FormField label="Name" error={errors.name?.message}>
          <TextInput {...register("name")} hasError={Boolean(errors.name)} />
        </FormField>
        <FormField label="Slug" error={errors.slug?.message}>
          <TextInput {...register("slug")} hasError={Boolean(errors.slug)} />
        </FormField>
        <FormField
          label="Color"
          description="Optional CSS color such as #0058bc."
          error={errors.color?.message}
        >
          <TextInput
            {...register("color")}
            placeholder="#0058bc"
            hasError={Boolean(errors.color)}
          />
        </FormField>
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {tag ? "Save changes" : "Create topic"}
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}

function TaxonomyModeButton({
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
      className={
        active
          ? "h-9 rounded bg-background px-3 text-sm font-medium text-foreground shadow-sm"
          : "h-9 rounded px-3 text-sm text-muted-foreground hover:text-foreground"
      }
    >
      {label}
    </button>
  );
}

function TaxonomySkeleton() {
  return (
    <div className="space-y-2" aria-label="Loading blog taxonomy">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

function categoryDefaults(category: BlogCategory | null): CategoryInput {
  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    sortOrder: category?.sortOrder ?? 0,
  };
}

function tagDefaults(tag: BlogTag | null): TagValues {
  return { name: tag?.name ?? "", slug: tag?.slug ?? "", color: tag?.color ?? "" };
}
