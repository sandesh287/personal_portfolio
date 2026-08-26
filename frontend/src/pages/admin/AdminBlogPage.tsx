import { Edit3, ExternalLink, Plus, Search, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { routes } from "@/constants/routes";
import { BlogEditorModal } from "@/features/blog/components/BlogEditorModal";
import { BlogTaxonomyManager } from "@/features/blog/components/BlogTaxonomyManager";
import { useAdminBlogPost, useAdminBlogPosts, useDeleteBlogPost } from "@/features/blog/hooks";
import type { BlogPostSummary, BlogStatus } from "@/features/blog/types";
import { cn } from "@/utils/cn";
import { getErrorMessage } from "@/utils/errors";

const PAGE_SIZE = 15;

export function AdminBlogPage() {
  const [view, setView] = useState<"posts" | "taxonomy">("posts");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BlogStatus | "">("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string>();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const postsQuery = useAdminBlogPosts({
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
    status: status || undefined,
    sort: "updatedAt",
    order: "desc",
  });
  const postQuery = useAdminBlogPost(editingId);
  const deletePost = useDeleteBlogPost();
  const posts = postsQuery.data?.items ?? [];
  const meta = postsQuery.data?.meta;

  function openCreate() {
    setEditingId(undefined);
    setIsEditorOpen(true);
  }

  function openEdit(post: BlogPostSummary) {
    setEditingId(post.id);
    setIsEditorOpen(true);
  }

  async function handleDelete(post: BlogPostSummary) {
    if (!window.confirm(`Delete engineering note ${post.title}?`)) return;
    try {
      await deletePost.mutateAsync(post.id);
      toast.success("Engineering note deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Engineering note could not be deleted."));
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">Knowledge workspace</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Engineering Notes</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Author, organize, preview, and publish long-form technical writing.
          </p>
        </div>
        <Button
          type="button"
          leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
          onClick={openCreate}
        >
          New note
        </Button>
      </header>

      <nav
        className="flex gap-1 overflow-x-auto border-b border-border"
        aria-label="Blog management views"
      >
        <ViewButton label="Articles" active={view === "posts"} onClick={() => setView("posts")} />
        <ViewButton
          label="Categories and topics"
          active={view === "taxonomy"}
          onClick={() => setView("taxonomy")}
        />
      </nav>

      {view === "taxonomy" ? (
        <BlogTaxonomyManager />
      ) : (
        <section className="overflow-hidden rounded-md border border-border bg-background">
          <header className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1 lg:max-w-xl">
              <label>
                <span className="sr-only">Search engineering notes</span>
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
                  placeholder="Search articles..."
                  className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {(["", "draft", "published", "archived"] as const).map((value) => (
                <button
                  key={value || "all"}
                  type="button"
                  onClick={() => {
                    setStatus(value);
                    setPage(1);
                  }}
                  className={cn(
                    "h-10 shrink-0 rounded-md px-3 text-xs font-medium capitalize transition-colors",
                    status === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {value || "All"}
                </button>
              ))}
            </div>
          </header>

          <div className="p-4">
            {postsQuery.isLoading ? <PostsSkeleton /> : null}
            {postsQuery.isError ? (
              <EmptyState
                title="Engineering notes could not be loaded"
                description={getErrorMessage(postsQuery.error)}
              />
            ) : null}
            {!postsQuery.isLoading && !postsQuery.isError && posts.length === 0 ? (
              <EmptyState
                title="No engineering notes found"
                description="Create a note or adjust the active search and status filters."
              />
            ) : null}
            {posts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="min-w-56 max-w-xl">
                          <div className="flex items-center gap-2">
                            <p className="line-clamp-1 font-medium text-foreground">{post.title}</p>
                            {post.featured ? (
                              <Star
                                className="h-3.5 w-3.5 shrink-0 text-primary"
                                aria-label="Featured"
                              />
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {post.excerpt}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={post.status} />
                      </TableCell>
                      <TableCell>{post.category?.name ?? "Uncategorized"}</TableCell>
                      <TableCell>{formatDate(post.updatedAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {post.status === "published" ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              leftIcon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
                              onClick={() =>
                                window.open(
                                  routes.blogDetails.replace(":slug", post.slug),
                                  "_blank",
                                  "noopener,noreferrer",
                                )
                              }
                            >
                              View published note
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            leftIcon={<Edit3 className="h-4 w-4" aria-hidden="true" />}
                            onClick={() => openEdit(post)}
                          >
                            Edit note
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            leftIcon={
                              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                            }
                            onClick={() => void handleDelete(post)}
                            isLoading={deletePost.isPending}
                          >
                            Delete note
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}

            {meta && posts.length > 0 ? (
              <footer className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {meta.totalItems} notes, page {meta.page} of {meta.totalPages || 1}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={!meta.hasPreviousPage}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
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
      )}

      <BlogEditorModal
        isOpen={isEditorOpen}
        post={editingId ? (postQuery.data ?? null) : null}
        isPostLoading={Boolean(editingId) && postQuery.isLoading}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingId(undefined);
        }}
      />
    </div>
  );
}

function ViewButton({
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
        "min-h-11 shrink-0 border-b-2 px-3 text-sm font-medium transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: BlogStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium capitalize",
        status === "published" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        status === "draft" && "bg-primary/10 text-primary",
        status === "archived" && "bg-muted text-muted-foreground",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}

function PostsSkeleton() {
  return (
    <div className="space-y-2" aria-label="Loading engineering notes">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(
    new Date(value),
  );
}
