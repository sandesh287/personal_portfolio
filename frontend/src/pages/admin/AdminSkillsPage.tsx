import { zodResolver } from "@hookform/resolvers/zod";
import { Edit3, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState } from "@/components/common/EmptyState";
import { SkillIcon, skillIconIdentifiers } from "@/components/icons/SkillIcon";
import { FormActions } from "@/components/form/FormActions";
import { FormField, TextInput } from "@/components/form/FormField";
import { SelectField } from "@/components/form/SelectField";
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
import { useTechnologies } from "@/features/projects";
import { useCreateSkill, useDeleteSkill, useSkills, useUpdateSkill } from "@/features/skills";
import type { Skill, SkillMutationPayload } from "@/features/skills";
import { getErrorMessage } from "@/utils/errors";

const PAGE_SIZE = 20;

const skillSchema = z.object({
  technologyId: z.string(),
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  category: z.string().min(2).max(80),
  level: z.coerce.number().int().min(1).max(5),
  icon: z.string().max(120),
  color: z.string().max(32),
  description: z.string().max(2000),
  sortOrder: z.coerce.number().int().min(0),
});

type SkillInput = z.input<typeof skillSchema>;
type SkillValues = z.output<typeof skillSchema>;

export function AdminSkillsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const query = useSkills({
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
    category: category || undefined,
    sort: "sortOrder",
    order: "asc",
  });
  const allSkillsQuery = useSkills({ pageSize: 100, sort: "category", order: "asc" });
  const deleteSkill = useDeleteSkill();
  const categories = useMemo(
    () => [...new Set(allSkillsQuery.data?.items.map((skill) => skill.category) ?? [])],
    [allSkillsQuery.data?.items],
  );
  const skills = query.data?.items ?? [];
  const meta = query.data?.meta;

  async function handleDelete(skill: Skill) {
    if (!window.confirm(`Delete skill ${skill.name}?`)) return;
    try {
      await deleteSkill.mutateAsync(skill.id);
      toast.success("Skill deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Skill could not be deleted."));
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">Technology graph</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Skills management</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Maintain graph nodes, categories, proficiency, and canonical technology links.
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
          onClick={() => {
            setEditingSkill(null);
            setIsFormOpen(true);
          }}
        >
          New skill
        </Button>
      </header>

      <section className="overflow-hidden rounded-md border border-border bg-background">
        <header className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search skills</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search skills..."
              className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <SelectField
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="w-full lg:w-52"
            aria-label="Filter skills by category"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
        </header>

        <div className="p-4">
          {query.isLoading ? <SkillsTableSkeleton /> : null}
          {query.isError ? (
            <EmptyState
              title="Skills could not be loaded"
              description={getErrorMessage(query.error)}
            />
          ) : null}
          {!query.isLoading && !query.isError && skills.length === 0 ? (
            <EmptyState
              title="No skills found"
              description="Create a skill or adjust the filters."
            />
          ) : null}
          {skills.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skill</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Technology</TableHead>
                  <TableHead>Sort</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.map((skill) => (
                  <TableRow key={skill.id}>
                    <TableCell>
                      <div className="flex min-w-48 items-center gap-3">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface"
                          style={{ color: skill.color ?? undefined }}
                        >
                          <SkillIcon identifier={skill.icon} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{skill.name}</p>
                          <p className="text-xs text-muted-foreground">{skill.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{skill.category}</TableCell>
                    <TableCell>{skill.level} / 5</TableCell>
                    <TableCell>{skill.technologyId ? "Linked" : "Independent"}</TableCell>
                    <TableCell>{skill.sortOrder}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          leftIcon={<Edit3 className="h-4 w-4" aria-hidden="true" />}
                          onClick={() => {
                            setEditingSkill(skill);
                            setIsFormOpen(true);
                          }}
                        >
                          Edit skill
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          leftIcon={
                            <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                          }
                          onClick={() => void handleDelete(skill)}
                          isLoading={deleteSkill.isPending}
                        >
                          Delete skill
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}

          {meta && skills.length ? (
            <footer className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {meta.totalItems} skills, page {meta.page} of {meta.totalPages || 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!meta.hasPreviousPage}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </footer>
          ) : null}
        </div>
      </section>

      <SkillFormModal
        skill={editingSkill}
        isOpen={isFormOpen}
        categories={categories}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
}

function SkillFormModal({
  skill,
  isOpen,
  categories,
  onClose,
}: {
  skill: Skill | null;
  isOpen: boolean;
  categories: string[];
  onClose: () => void;
}) {
  const technologies = useTechnologies();
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill(skill?.id ?? "");
  const isSubmitting = createSkill.isPending || updateSkill.isPending;
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<SkillInput, unknown, SkillValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: skillDefaults(skill),
  });

  useEffect(() => {
    if (isOpen) reset(skillDefaults(skill));
  }, [isOpen, reset, skill]);

  async function onSubmit(values: SkillValues) {
    const payload: SkillMutationPayload = {
      technologyId: values.technologyId || null,
      name: values.name.trim(),
      slug: values.slug.trim(),
      category: values.category.trim(),
      level: values.level,
      icon: values.icon.trim() || null,
      color: values.color.trim() || null,
      description: values.description.trim() || null,
      sortOrder: values.sortOrder,
    };
    try {
      if (skill) await updateSkill.mutateAsync(payload);
      else await createSkill.mutateAsync(payload);
      toast.success(`Skill ${skill ? "updated" : "created"}.`);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Skill could not be saved."));
    }
  }

  return (
    <Modal
      title={skill ? "Edit skill" : "Create skill"}
      description="Configure one node in the public Skills Graph."
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl"
    >
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" error={errors.name?.message}>
            <TextInput {...register("name")} hasError={Boolean(errors.name)} />
          </FormField>
          <FormField label="Slug" error={errors.slug?.message}>
            <TextInput {...register("slug")} hasError={Boolean(errors.slug)} />
          </FormField>
          <FormField label="Category" error={errors.category?.message}>
            <TextInput
              {...register("category")}
              list="skill-categories"
              hasError={Boolean(errors.category)}
            />
            <datalist id="skill-categories">
              {categories.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </FormField>
          <FormField label="Proficiency" error={errors.level?.message}>
            <SelectField {...register("level")}>
              <option value="1">1 - Foundation</option>
              <option value="2">2 - Working</option>
              <option value="3">3 - Proficient</option>
              <option value="4">4 - Advanced</option>
              <option value="5">5 - Expert</option>
            </SelectField>
          </FormField>
        </div>
        <FormField
          label="Canonical technology"
          description="Optional link to the Projects technology catalog."
        >
          <SelectField {...register("technologyId")}>
            <option value="">Independent skill</option>
            {technologies.data?.map((technology) => (
              <option key={technology.id} value={technology.id}>
                {technology.name}
              </option>
            ))}
          </SelectField>
        </FormField>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Icon">
            <TextInput {...register("icon")} list="skill-icons" placeholder="react" />
            <datalist id="skill-icons">
              {skillIconIdentifiers.map((identifier) => (
                <option key={identifier} value={identifier} />
              ))}
            </datalist>
          </FormField>
          <FormField label="Color">
            <TextInput {...register("color")} placeholder="#0058bc" />
          </FormField>
          <FormField label="Sort order">
            <TextInput type="number" min={0} {...register("sortOrder")} />
          </FormField>
        </div>
        <FormField label="Description" error={errors.description?.message}>
          <Textarea {...register("description")} hasError={Boolean(errors.description)} />
        </FormField>
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {skill ? "Save changes" : "Create skill"}
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}

function SkillsTableSkeleton() {
  return (
    <div className="space-y-2" aria-label="Loading skills">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

function skillDefaults(skill: Skill | null): SkillInput {
  return {
    technologyId: skill?.technologyId ?? "",
    name: skill?.name ?? "",
    slug: skill?.slug ?? "",
    category: skill?.category ?? "",
    level: skill?.level ?? 3,
    icon: skill?.icon ?? "",
    color: skill?.color ?? "",
    description: skill?.description ?? "",
    sortOrder: skill?.sortOrder ?? 0,
  };
}
