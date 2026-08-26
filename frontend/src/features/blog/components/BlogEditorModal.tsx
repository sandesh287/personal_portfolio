import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, FileImage, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FormField, TextInput } from "@/components/form/FormField";
import { SelectField } from "@/components/form/SelectField";
import { Textarea } from "@/components/form/Textarea";
import { MediaImagePickerModal } from "@/components/media/MediaImagePickerModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { BlogArticleContent } from "@/features/blog/components/BlogArticleContent";
import {
  useBlogCategories,
  useBlogTags,
  useCreateBlogPost,
  useUpdateBlogPost,
} from "@/features/blog/hooks";
import type { BlogPost, BlogPostMutationPayload, BlogStatus } from "@/features/blog/types";
import type { MediaAsset } from "@/features/media";
import { cn } from "@/utils/cn";
import { getResponsiveImageAttributes } from "@/utils/cloudinaryImage";
import { getErrorMessage } from "@/utils/errors";

const postSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters.").max(220),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .max(240)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  excerpt: z.string().min(2, "Excerpt is required.").max(500),
  content: z.string().min(1, "Article content is required."),
  categoryId: z.string(),
  coverImageId: z.string(),
  tagIds: z.array(z.string()),
  status: z.enum(["draft", "published", "archived"]),
  featured: z.boolean(),
  readingTimeMinutes: z.coerce.number().int().min(1).max(999),
  seoTitle: z.string().max(255),
  seoDescription: z.string().max(500),
  publishedAt: z.string(),
});

type BlogEditorInput = z.input<typeof postSchema>;
type BlogEditorValues = z.output<typeof postSchema>;

interface BlogEditorModalProps {
  isOpen: boolean;
  post: BlogPost | null;
  isPostLoading?: boolean;
  onClose: () => void;
}

export function BlogEditorModal({
  isOpen,
  post,
  isPostLoading = false,
  onClose,
}: BlogEditorModalProps) {
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [selectedCover, setSelectedCover] = useState<MediaAsset | null>(null);
  const categoriesQuery = useBlogCategories();
  const tagsQuery = useBlogTags();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost(post?.id ?? "");
  const isSubmitting = createPost.isPending || updatePost.isPending;

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<BlogEditorInput, unknown, BlogEditorValues>({
    resolver: zodResolver(postSchema),
    defaultValues: getPostDefaults(null),
  });
  const content = watch("content");
  const coverImageId = watch("coverImageId");
  const status = watch("status");

  useEffect(() => {
    if (!isOpen) return;
    reset(getPostDefaults(post));
    setEditorMode("write");
    setSelectedCover(null);
  }, [isOpen, post, reset]);

  const existingCoverAttributes = useMemo(() => {
    if (!post?.coverImage?.publicUrl || selectedCover) return null;
    return getResponsiveImageAttributes(post.coverImage.publicUrl, {
      widths: [320, 640, 960],
      sizes: "(min-width: 768px) 320px, calc(100vw - 4rem)",
      imageWidth: post.coverImage.imageWidth,
      imageHeight: post.coverImage.imageHeight,
      placeholderUrl: post.coverImage.placeholderUrl,
    });
  }, [post, selectedCover]);

  async function onSubmit(values: BlogEditorValues) {
    const payload: BlogPostMutationPayload = {
      title: values.title.trim(),
      slug: values.slug.trim(),
      excerpt: values.excerpt.trim(),
      content: values.content,
      categoryId: values.categoryId || null,
      coverImageId: values.coverImageId || null,
      tagIds: values.tagIds,
      status: values.status,
      featured: values.featured,
      readingTimeMinutes: values.readingTimeMinutes,
      seoTitle: values.seoTitle.trim() || null,
      seoDescription: values.seoDescription.trim() || null,
      publishedAt: normalizePublishedAt(values.status, values.publishedAt),
    };

    try {
      if (post) {
        await updatePost.mutateAsync(payload);
        toast.success("Engineering note updated.");
      } else {
        await createPost.mutateAsync(payload);
        toast.success("Engineering note created.");
      }
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Engineering note could not be saved."));
    }
  }

  function selectCover(media: MediaAsset) {
    setSelectedCover(media);
    setValue("coverImageId", media.id, { shouldDirty: true });
    setIsMediaPickerOpen(false);
  }

  function clearCover() {
    setSelectedCover(null);
    setValue("coverImageId", "", { shouldDirty: true });
    setIsMediaPickerOpen(false);
  }

  const selectedCoverAttributes = selectedCover?.publicUrl
    ? getResponsiveImageAttributes(selectedCover.publicUrl, {
        widths: [320, 640, 960],
        sizes: "(min-width: 768px) 320px, calc(100vw - 4rem)",
        imageWidth: selectedCover.imageWidth,
        imageHeight: selectedCover.imageHeight,
        placeholderUrl: selectedCover.placeholderUrl,
      })
    : null;
  const displayedCover = coverImageId ? (selectedCoverAttributes ?? existingCoverAttributes) : null;

  return (
    <>
      <Modal
        title={post ? "Edit engineering note" : "Create engineering note"}
        description="Write in Markdown, configure publication metadata, and preview before saving."
        isOpen={isOpen}
        onClose={() => {
          if (!isMediaPickerOpen) onClose();
        }}
        className="max-w-6xl"
      >
        {isPostLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground" role="status">
            Loading note...
          </p>
        ) : (
          <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
              <div className="min-w-0 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Title" error={errors.title?.message}>
                    <TextInput {...register("title")} hasError={Boolean(errors.title)} />
                  </FormField>
                  <FormField label="Slug" error={errors.slug?.message}>
                    <TextInput {...register("slug")} hasError={Boolean(errors.slug)} />
                  </FormField>
                </div>
                <FormField
                  label="Excerpt"
                  description="Used in article indexes and social summaries."
                  error={errors.excerpt?.message}
                >
                  <Textarea
                    {...register("excerpt")}
                    rows={3}
                    className="min-h-24"
                    hasError={Boolean(errors.excerpt)}
                  />
                </FormField>

                <section className="overflow-hidden rounded-md border border-border bg-background">
                  <header className="flex items-center justify-between gap-3 border-b border-border p-2">
                    <div className="flex rounded-md bg-muted p-1" aria-label="Editor mode">
                      <ModeButton
                        label="Write"
                        active={editorMode === "write"}
                        onClick={() => setEditorMode("write")}
                      />
                      <ModeButton
                        label="Preview"
                        active={editorMode === "preview"}
                        onClick={() => setEditorMode("preview")}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">Markdown</span>
                  </header>
                  {editorMode === "write" ? (
                    <div>
                      <label htmlFor="blog-content" className="sr-only">
                        Article content
                      </label>
                      <textarea
                        id="blog-content"
                        {...register("content")}
                        spellCheck="true"
                        className={cn(
                          "min-h-[26rem] w-full resize-y bg-background p-4 font-mono text-sm leading-6 text-foreground outline-none",
                          errors.content ? "ring-1 ring-inset ring-destructive" : "",
                        )}
                      />
                      {errors.content ? (
                        <p className="border-t border-border px-4 py-2 text-xs text-destructive">
                          {errors.content.message}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="min-h-[26rem] p-4 sm:p-6">
                      {content.trim() ? (
                        <BlogArticleContent content={content} />
                      ) : (
                        <div className="flex min-h-72 flex-col items-center justify-center text-center text-muted-foreground">
                          <Eye className="mb-3 h-8 w-8" aria-hidden="true" />
                          <p className="text-sm">Preview appears as you write.</p>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                <details className="rounded-md border border-border bg-background p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">
                    Search metadata
                  </summary>
                  <div className="mt-4 space-y-4">
                    <FormField label="SEO title" error={errors.seoTitle?.message}>
                      <TextInput {...register("seoTitle")} hasError={Boolean(errors.seoTitle)} />
                    </FormField>
                    <FormField label="SEO description" error={errors.seoDescription?.message}>
                      <Textarea
                        {...register("seoDescription")}
                        rows={3}
                        className="min-h-24"
                        hasError={Boolean(errors.seoDescription)}
                      />
                    </FormField>
                  </div>
                </details>
              </div>

              <aside className="space-y-5 xl:border-l xl:border-border xl:pl-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <FormField label="Status" error={errors.status?.message}>
                    <SelectField {...register("status")}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </SelectField>
                  </FormField>
                  <FormField label="Category" error={errors.categoryId?.message}>
                    <SelectField {...register("categoryId")}>
                      <option value="">Uncategorized</option>
                      {categoriesQuery.data?.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </SelectField>
                  </FormField>
                  <FormField label="Reading time" error={errors.readingTimeMinutes?.message}>
                    <TextInput
                      type="number"
                      min={1}
                      {...register("readingTimeMinutes")}
                      hasError={Boolean(errors.readingTimeMinutes)}
                    />
                  </FormField>
                  <FormField
                    label="Published at"
                    description={status === "published" ? "Defaults to now when empty." : undefined}
                    error={errors.publishedAt?.message}
                  >
                    <TextInput type="datetime-local" {...register("publishedAt")} />
                  </FormField>
                </div>

                <label className="flex min-h-10 items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    {...register("featured")}
                    className="h-4 w-4 accent-primary"
                  />
                  Feature this note
                </label>

                <fieldset>
                  <legend className="text-sm font-medium text-foreground">Topics</legend>
                  <div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-md border border-border bg-background p-2">
                    {tagsQuery.data?.length ? (
                      tagsQuery.data.map((tag) => (
                        <label
                          key={tag.id}
                          className="flex min-h-9 items-center gap-2 rounded px-2 text-sm text-foreground hover:bg-muted"
                        >
                          <input
                            type="checkbox"
                            value={tag.id}
                            {...register("tagIds")}
                            className="h-4 w-4 accent-primary"
                          />
                          {tag.name}
                        </label>
                      ))
                    ) : (
                      <p className="px-2 py-3 text-xs text-muted-foreground">No topics created.</p>
                    )}
                  </div>
                </fieldset>

                <section>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium text-foreground">Cover image</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      leftIcon={<FileImage className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => setIsMediaPickerOpen(true)}
                    >
                      Choose
                    </Button>
                  </div>
                  <div className="mt-2 aspect-video overflow-hidden rounded-md border border-border bg-muted">
                    {displayedCover ? (
                      <img
                        {...displayedCover}
                        alt="Selected article cover"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <FileImage className="h-7 w-7" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                </section>
              </aside>
            </div>

            <footer className="sticky -bottom-3 z-10 -mx-3 -mb-3 mt-6 flex flex-col-reverse gap-2 border-t border-border bg-surface px-3 pb-3 pt-4 sm:-bottom-4 sm:-mx-4 sm:-mb-4 sm:flex-row sm:justify-end sm:px-4 sm:pb-4">
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}
              >
                {post ? "Save changes" : "Create note"}
              </Button>
            </footer>
          </form>
        )}
      </Modal>

      <MediaImagePickerModal
        isOpen={isMediaPickerOpen}
        selectedId={coverImageId || null}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={selectCover}
        onClear={clearCover}
      />
    </>
  );
}

function ModeButton({
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
        "h-8 rounded px-3 text-xs font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function getPostDefaults(post: BlogPost | null): BlogEditorInput {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    categoryId: post?.category?.id ?? "",
    coverImageId: post?.coverImage?.id ?? "",
    tagIds: post?.tags.map((tag) => tag.id) ?? [],
    status: post?.status ?? "draft",
    featured: post?.featured ?? false,
    readingTimeMinutes: post?.readingTimeMinutes ?? 1,
    seoTitle: post?.seoTitle ?? "",
    seoDescription: post?.seoDescription ?? "",
    publishedAt: toDateTimeLocal(post?.publishedAt),
  };
}

function normalizePublishedAt(status: BlogStatus, value: string): string | null {
  if (value) return new Date(value).toISOString();
  return status === "published" ? new Date().toISOString() : null;
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
