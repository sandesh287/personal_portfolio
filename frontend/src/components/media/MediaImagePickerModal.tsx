import { Check, FileImage, Search } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMediaList } from "@/features/media";
import type { MediaAsset } from "@/features/media";
import { cn } from "@/utils/cn";
import { getResponsiveImageAttributes } from "@/utils/cloudinaryImage";
import { getErrorMessage } from "@/utils/errors";

interface MediaImagePickerModalProps {
  isOpen: boolean;
  selectedId: string | null;
  onClose: () => void;
  onSelect: (media: MediaAsset) => void;
  onClear?: () => void;
  title?: string;
  description?: string;
  clearLabel?: string;
}

export function MediaImagePickerModal({
  isOpen,
  selectedId,
  onClose,
  onSelect,
  onClear,
  title = "Choose cover image",
  description = "Select an image already uploaded to the Media Library.",
  clearLabel = "Clear cover",
}: MediaImagePickerModalProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useMediaList(
    {
      page,
      pageSize: 18,
      search: search.trim() || undefined,
      contentType: "image",
      sort: "created_at",
      order: "desc",
    },
    isOpen,
  );
  const mediaItems = query.data?.items ?? [];

  return (
    <Modal
      title={title}
      description={description}
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-5xl"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search Media Library images</span>
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
              placeholder="Search images..."
              className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          {onClear ? (
            <Button type="button" variant="secondary" onClick={onClear} disabled={!selectedId}>
              {clearLabel}
            </Button>
          ) : null}
        </div>

        {query.isLoading ? <MediaPickerSkeleton /> : null}
        {query.isError ? (
          <EmptyState
            title="Media Library could not be loaded"
            description={getErrorMessage(query.error)}
          />
        ) : null}
        {!query.isLoading && !query.isError && mediaItems.length === 0 ? (
          <EmptyState
            title="No images found"
            description="Upload an image in Media Library, then return here to select it."
          />
        ) : null}
        {mediaItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {mediaItems.map((media) => {
              const isSelected = selectedId === media.id;
              const image = media.publicUrl
                ? getResponsiveImageAttributes(media.publicUrl, {
                    widths: [160, 320, 480],
                    sizes: "(min-width: 1280px) 150px, (min-width: 640px) 25vw, 45vw",
                    imageWidth: media.imageWidth,
                    imageHeight: media.imageHeight,
                    placeholderUrl: media.placeholderUrl,
                  })
                : null;

              return (
                <button
                  key={media.id}
                  type="button"
                  onClick={() => onSelect(media)}
                  className={cn(
                    "group relative min-w-0 overflow-hidden rounded-md border bg-background text-left transition-colors",
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary",
                  )}
                >
                  <span className="flex aspect-square items-center justify-center overflow-hidden bg-muted">
                    {image ? (
                      <img
                        {...image}
                        alt={media.altText || media.originalFilename}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FileImage className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
                    )}
                  </span>
                  <span className="block truncate px-2 py-2 text-xs text-foreground">
                    {media.originalFilename}
                  </span>
                  {isSelected ? (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Selected</span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {query.data?.meta && query.data.meta.totalPages > 1 ? (
          <footer className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              Page {query.data.meta.page} of {query.data.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!query.data.meta.hasPreviousPage}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!query.data.meta.hasNextPage}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </footer>
        ) : null}
      </div>
    </Modal>
  );
}

function MediaPickerSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
      aria-label="Loading Media Library images"
    >
      {Array.from({ length: 12 }).map((_, index) => (
        <Skeleton key={index} className="aspect-square w-full" />
      ))}
    </div>
  );
}
