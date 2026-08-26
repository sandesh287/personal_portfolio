import { ArrowLeft, BookOpen, CalendarDays, Clock3 } from "lucide-react";
import { Link, useParams } from "react-router";

import { EmptyState } from "@/components/common/EmptyState";
import { SeoMetadata } from "@/components/common/SeoMetadata";
import { Skeleton } from "@/components/ui/Skeleton";
import { routes } from "@/constants/routes";
import { useBlogPost } from "@/features/blog";
import { BlogArticleContent } from "@/features/blog/components/BlogArticleContent";
import { getResponsiveImageAttributes } from "@/utils/cloudinaryImage";
import { getErrorMessage } from "@/utils/errors";

export function BlogDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, error, isError, isLoading } = useBlogPost(slug);

  const seo = post ? (
    <SeoMetadata
      title={post.seoTitle || `${post.title} | Sandesh`}
      description={post.seoDescription || post.excerpt}
      path={routes.blogDetails.replace(":slug", post.slug)}
      image={post.coverImage?.publicUrl}
      type="article"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.seoDescription || post.excerpt,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        image: post.coverImage?.publicUrl,
      }}
    />
  ) : null;

  if (isLoading)
    return (
      <>
        {seo}
        <ArticleSkeleton />
      </>
    );

  if (isError) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-surface p-4 sm:p-6">
        {seo}
        <BackLink />
        <div className="mt-6">
          <EmptyState
            title="This engineering note could not be loaded"
            description={getErrorMessage(error, "The note may have moved or is not published.")}
          />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-surface p-4 sm:p-6">
        {seo}
        <BackLink />
        <div className="mt-6">
          <EmptyState title="Engineering note not found" />
        </div>
      </div>
    );
  }

  const cover = post.coverImage?.publicUrl
    ? getResponsiveImageAttributes(post.coverImage.publicUrl, {
        widths: [480, 768, 1024, 1440, 1920],
        sizes:
          "(min-width: 1280px) 768px, (min-width: 768px) calc(100vw - 10rem), calc(100vw - 3rem)",
        imageWidth: post.coverImage.imageWidth,
        imageHeight: post.coverImage.imageHeight,
        placeholderUrl: post.coverImage.placeholderUrl,
      })
    : null;

  return (
    <article className="min-h-[calc(100vh-8rem)] bg-surface">
      {seo}
      <header className="border-b border-border p-4 sm:p-6 lg:px-8">
        <BackLink />
        <div className="mx-auto mt-8 max-w-5xl">
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
          <h1 className="mt-4 max-w-4xl break-words text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{post.excerpt}</p>
          {post.tags.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2" aria-label="Article topics">
              {post.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded border border-border bg-background px-2 py-1 text-xs text-muted-foreground"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {cover ? (
          <div className="mb-8 aspect-video overflow-hidden rounded-md border border-border bg-muted sm:mb-10">
            <img
              {...cover}
              alt={post.coverImage?.altText || `${post.title} cover`}
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <div className="xl:grid xl:grid-cols-[minmax(0,48rem)_12rem] xl:gap-12">
          <main className="min-w-0">
            <BlogArticleContent content={post.content} />
          </main>
          <aside className="mt-10 border-t border-border pt-6 xl:sticky xl:top-24 xl:mt-0 xl:self-start xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
              Note metadata
            </div>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Published</dt>
                <dd className="mt-1 text-foreground">
                  {formatDate(post.publishedAt ?? post.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Reading time</dt>
                <dd className="mt-1 text-foreground">{post.readingTimeMinutes} minutes</dd>
              </div>
              {post.category ? (
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Category</dt>
                  <dd className="mt-1 break-words text-foreground">{post.category.name}</dd>
                </div>
              ) : null}
            </dl>
          </aside>
        </div>
      </div>
    </article>
  );
}

function BackLink() {
  return (
    <Link
      to={routes.blog}
      className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Engineering Notes
    </Link>
  );
}

function ArticleSkeleton() {
  return (
    <div
      className="min-h-[calc(100vh-8rem)] bg-surface p-4 sm:p-6 lg:px-8"
      aria-label="Loading engineering note"
    >
      <Skeleton className="h-10 w-40" />
      <div className="mx-auto mt-8 max-w-5xl">
        <Skeleton className="h-3 w-56" />
        <Skeleton className="mt-5 h-9 w-4/5" />
        <Skeleton className="mt-3 h-9 w-2/3" />
        <Skeleton className="mt-5 h-5 w-full max-w-2xl" />
        <Skeleton className="mt-8 aspect-video w-full" />
        <div className="mt-10 max-w-3xl space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="mt-8 h-7 w-1/2" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
