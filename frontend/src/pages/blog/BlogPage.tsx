import { ArrowRight, BookOpen, CalendarDays, Clock3, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { routes } from "@/constants/routes";
import {
  useBlogCategories,
  useBlogPosts,
  useBlogTags,
  useFeaturedBlogPosts,
} from "@/features/blog";
import type { BlogPostSummary } from "@/features/blog";
import { cn } from "@/utils/cn";
import { getResponsiveImageAttributes } from "@/utils/cloudinaryImage";
import { getErrorMessage } from "@/utils/errors";

const PAGE_SIZE = 8;

export function BlogPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>();
  const [tag, setTag] = useState<string>();
  const [page, setPage] = useState(1);
  const hasActiveFilters = Boolean(search.trim() || category || tag);

  const { data, error, isError, isFetching, isLoading } = useBlogPosts({
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
    category,
    tag,
    sort: "publishedAt",
    order: "desc",
  });
  const { data: featuredPosts = [], isLoading: isFeaturedLoading } = useFeaturedBlogPosts({
    limit: 3,
  });
  const { data: categories = [], isLoading: areCategoriesLoading } = useBlogCategories();
  const { data: tags = [], isLoading: areTagsLoading } = useBlogTags();
  const posts = useMemo(() => data?.items ?? [], [data?.items]);
  const meta = data?.meta;

  function updateFilter(setter: (value: string | undefined) => void, value?: string) {
    setter(value);
    setPage(1);
  }

  return (
    <section className="min-h-[calc(100vh-8rem)] bg-surface">
      <header className="border-b border-border p-4 sm:p-6">
        <p className="text-xs font-medium uppercase text-muted-foreground">Knowledge Base</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Engineering Notes</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Field notes on frontend systems, Flutter applications, data science, and the choices
              behind production software.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>{meta?.totalItems ?? posts.length} published notes</span>
          </div>
        </div>
      </header>

      <div className="border-b border-border p-4 sm:p-6">
        <label className="relative block">
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
            placeholder="Search notes by title, excerpt, or content..."
            className="h-11 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <FilterRow
          label="Category"
          allLabel="All categories"
          activeValue={category}
          isLoading={areCategoriesLoading}
          items={categories.map((item) => ({ value: item.slug, label: item.name }))}
          onChange={(value) => updateFilter(setCategory, value)}
        />
        <FilterRow
          label="Topic"
          allLabel="All topics"
          activeValue={tag}
          isLoading={areTagsLoading}
          items={tags.map((item) => ({ value: item.slug, label: item.name }))}
          onChange={(value) => updateFilter(setTag, value)}
        />
      </div>

      {!hasActiveFilters && page === 1 && (isFeaturedLoading || featuredPosts.length > 0) ? (
        <section className="border-b border-border p-4 sm:p-6" aria-labelledby="featured-notes">
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 id="featured-notes" className="text-sm font-semibold text-foreground">
              Featured notes
            </h2>
          </div>
          {isFeaturedLoading ? (
            <FeaturedSkeleton />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {featuredPosts.map((post) => (
                <FeaturedNote key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section className="p-4 sm:p-6" aria-labelledby="all-notes">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="all-notes" className="text-sm font-semibold text-foreground">
            {hasActiveFilters ? "Search results" : "Latest notes"}
          </h2>
          {isFetching && !isLoading ? (
            <span className="text-xs text-muted-foreground" role="status">
              Refreshing index...
            </span>
          ) : null}
        </div>

        {isError ? (
          <EmptyState
            title="Engineering notes could not be loaded"
            description={getErrorMessage(error, "Check that the backend is running and try again.")}
          />
        ) : null}
        {isLoading ? <NotesListSkeleton /> : null}
        {!isLoading && !isError && posts.length === 0 ? (
          <EmptyState
            title="No notes found"
            description="Try another search term or clear the selected filters."
          />
        ) : null}
        {!isLoading && !isError && posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => (
              <NoteRow key={post.id} post={post} />
            ))}
          </div>
        ) : null}

        {meta && posts.length > 0 ? (
          <footer className="mt-6 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages || 1}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="min-h-10 sm:min-h-8"
                disabled={!meta.hasPreviousPage}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="min-h-10 sm:min-h-8"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </footer>
        ) : null}
      </section>
    </section>
  );
}

function FeaturedNote({ post }: { post: BlogPostSummary }) {
  const image = post.coverImage?.publicUrl
    ? getResponsiveImageAttributes(post.coverImage.publicUrl, {
        widths: [320, 640, 960],
        sizes: "(min-width: 1280px) 30vw, (min-width: 768px) 50vw, calc(100vw - 3rem)",
        imageWidth: post.coverImage.imageWidth,
        imageHeight: post.coverImage.imageHeight,
        placeholderUrl: post.coverImage.placeholderUrl,
      })
    : null;

  return (
    <article className="group overflow-hidden rounded-md border border-border bg-background transition-colors hover:border-primary/60">
      <div className="aspect-[16/8] overflow-hidden border-b border-border bg-muted">
        {image ? (
          <img
            {...image}
            alt={post.coverImage?.altText || `${post.title} cover`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-primary">
            <BookOpen className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="p-4">
        <NoteMeta post={post} />
        <h3 className="mt-3 line-clamp-2 break-words text-base font-semibold text-foreground">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
        <ArticleLink post={post} />
      </div>
    </article>
  );
}

function NoteRow({ post }: { post: BlogPostSummary }) {
  return (
    <article className="group rounded-md border border-border bg-background p-4 transition-colors hover:border-primary/60 sm:p-5">
      <NoteMeta post={post} />
      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold text-foreground">{post.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground sm:line-clamp-2">
            {post.excerpt}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.slice(0, 5).map((item) => (
              <span
                key={item.id}
                className="rounded border border-border bg-surface px-2 py-1 text-xs text-muted-foreground"
              >
                #{item.name}
              </span>
            ))}
          </div>
        </div>
        <ArticleLink post={post} />
      </div>
    </article>
  );
}

function NoteMeta({ post }: { post: BlogPostSummary }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
      {post.category ? (
        <span className="font-medium uppercase text-primary">{post.category.name}</span>
      ) : null}
      <span className="inline-flex items-center gap-1">
        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
        {formatDate(post.publishedAt ?? post.createdAt)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
        {post.readingTimeMinutes} min read
      </span>
    </div>
  );
}

function ArticleLink({ post }: { post: BlogPostSummary }) {
  return (
    <Link
      to={routes.blogDetails.replace(":slug", post.slug)}
      className="mt-3 inline-flex min-h-10 shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline lg:mt-0"
    >
      Read note
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}

function FilterRow({
  label,
  allLabel,
  activeValue,
  isLoading,
  items,
  onChange,
}: {
  label: string;
  allLabel: string;
  activeValue: string | undefined;
  isLoading: boolean;
  items: Array<{ value: string; label: string }>;
  onChange: (value?: string) => void;
}) {
  return (
    <div className="mt-3 min-w-0 sm:flex sm:items-center sm:gap-3">
      <span className="mb-2 block w-20 shrink-0 text-xs font-medium uppercase text-muted-foreground sm:mb-0">
        {label}
      </span>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip label={allLabel} active={!activeValue} onClick={() => onChange()} />
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-24 shrink-0 rounded-full sm:h-8" />
            <Skeleton className="h-10 w-20 shrink-0 rounded-full sm:h-8" />
          </>
        ) : (
          items.map((item) => (
            <FilterChip
              key={item.value}
              label={item.label}
              active={activeValue === item.value}
              onClick={() => onChange(item.value)}
            />
          ))
        )}
      </div>
    </div>
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
        "h-10 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors sm:h-8",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function NotesListSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading engineering notes">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-md border border-border bg-background p-5">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="mt-4 h-5 w-3/4" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
        </div>
      ))}
    </div>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading featured notes">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-md border border-border bg-background">
          <Skeleton className="aspect-[16/8] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
