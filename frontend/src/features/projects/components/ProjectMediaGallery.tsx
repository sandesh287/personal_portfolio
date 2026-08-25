import { ChevronLeft, ChevronRight, Film, ImageIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/Button";
import type { Project, ProjectImage } from "@/features/projects/types";

export function ProjectMediaGallery({ project }: { project: Project }) {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const viewableImages = project.images.filter(
    (image): image is ProjectImage & { url: string } => Boolean(image.url),
  );
  const hasMedia = project.images.length > 0 || project.videos.length > 0;

  return (
    <section id="media" className="scroll-mt-16 p-4 lg:p-6">
      <h2 className="text-xl font-semibold text-foreground">Media</h2>
      {project.images.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-foreground">Screenshots</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {project.images.map((image) => {
              const viewableIndex = viewableImages.findIndex((item) => item.id === image.id);
              return (
                <figure
                  key={image.id}
                  className="min-w-0 overflow-hidden rounded-md border border-border bg-background"
                >
                  {image.url ? (
                    <button
                      type="button"
                      className="group relative block w-full overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                      onClick={() => setActiveImageIndex(viewableIndex)}
                      aria-label={`Open ${image.caption || "project screenshot"}`}
                    >
                      <img
                        src={image.url}
                        alt={image.caption ?? "Project screenshot"}
                        loading="lazy"
                        className="aspect-video w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      />
                      <span className="absolute bottom-2 right-2 rounded bg-black/75 px-2 py-1 text-xs text-white">
                        View
                      </span>
                    </button>
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-muted text-muted-foreground">
                      <ImageIcon className="h-8 w-8" aria-hidden="true" />
                    </div>
                  )}
                  {image.caption ? (
                    <figcaption className="break-words border-t border-border p-3 text-sm text-muted-foreground">
                      {image.caption}
                    </figcaption>
                  ) : null}
                </figure>
              );
            })}
          </div>
        </div>
      ) : null}

      {project.videos.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground">Videos</h3>
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {project.videos.map((video) => {
              const embedUrl = getVideoEmbedUrl(video.provider, video.externalUrl);
              return (
                <figure
                  key={video.id}
                  className="min-w-0 overflow-hidden rounded-md border border-border bg-background"
                >
                  {video.provider === "local" && video.url ? (
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      className="aspect-video w-full bg-black object-contain"
                    >
                      <source src={video.url} />
                    </video>
                  ) : embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={video.title || `${video.provider} project video`}
                      className="aspect-video w-full border-0 bg-black"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      loading="lazy"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-muted text-muted-foreground">
                      <Film className="h-8 w-8" aria-hidden="true" />
                    </div>
                  )}
                  {video.title || video.caption ? (
                    <figcaption className="break-words border-t border-border p-3">
                      {video.title ? (
                        <p className="text-sm font-medium text-foreground">{video.title}</p>
                      ) : null}
                      {video.caption ? (
                        <p className="mt-1 text-sm text-muted-foreground">{video.caption}</p>
                      ) : null}
                    </figcaption>
                  ) : null}
                </figure>
              );
            })}
          </div>
        </div>
      ) : null}

      {!hasMedia ? (
        <div className="mt-4">
          <EmptyState
            title="No project media yet"
            description="Screenshots and demos will appear here once they are uploaded from the admin workspace."
          />
        </div>
      ) : null}

      {activeImageIndex !== null ? (
        <ImageLightbox
          images={viewableImages}
          activeIndex={activeImageIndex}
          onActiveIndexChange={setActiveImageIndex}
          onClose={() => setActiveImageIndex(null)}
        />
      ) : null}
    </section>
  );
}

function ImageLightbox({
  images,
  activeIndex,
  onActiveIndexChange,
  onClose,
}: {
  images: Array<ProjectImage & { url: string }>;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const touchStartX = useRef<number | null>(null);
  const activeImage = images[activeIndex];
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && hasMultipleImages) {
        onActiveIndexChange((activeIndex - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight" && hasMultipleImages) {
        onActiveIndexChange((activeIndex + 1) % images.length);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, hasMultipleImages, images.length, onActiveIndexChange, onClose]);

  function showPrevious() {
    onActiveIndexChange((activeIndex - 1 + images.length) % images.length);
  }

  function showNext() {
    onActiveIndexChange((activeIndex + 1) % images.length);
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null || !hasMultipleImages) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < 50) return;
    if (distance > 0) showPrevious();
    else showNext();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/95 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Project image viewer"
    >
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 px-3 sm:px-4">
        <p className="truncate text-sm text-white/80">
          {activeIndex + 1} of {images.length}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/15 hover:text-white"
          leftIcon={<X className="h-5 w-5" aria-hidden="true" />}
          onClick={onClose}
        >
          Close image viewer
        </Button>
      </header>

      <div
        className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-2 pb-2 sm:px-16 sm:pb-4"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0].clientX;
        }}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={activeImage.url}
          alt={activeImage.caption ?? "Project screenshot"}
          className="max-h-full max-w-full select-none object-contain"
        />
        {hasMultipleImages ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 bg-black/50 text-white hover:bg-white/15 hover:text-white sm:inline-flex"
              leftIcon={<ChevronLeft className="h-6 w-6" aria-hidden="true" />}
              onClick={showPrevious}
            >
              Previous image
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 bg-black/50 text-white hover:bg-white/15 hover:text-white sm:inline-flex"
              leftIcon={<ChevronRight className="h-6 w-6" aria-hidden="true" />}
              onClick={showNext}
            >
              Next image
            </Button>
          </>
        ) : null}
      </div>

      <footer className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-t border-white/15 px-3 py-2 sm:px-4">
        <p className="min-w-0 flex-1 truncate text-sm text-white/75">
          {activeImage.caption || "Project screenshot"}
        </p>
        {hasMultipleImages ? (
          <div className="flex gap-2 sm:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="border border-white/20 text-white hover:bg-white/15 hover:text-white"
              leftIcon={<ChevronLeft className="h-5 w-5" aria-hidden="true" />}
              onClick={showPrevious}
            >
              Previous image
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="border border-white/20 text-white hover:bg-white/15 hover:text-white"
              leftIcon={<ChevronRight className="h-5 w-5" aria-hidden="true" />}
              onClick={showNext}
            >
              Next image
            </Button>
          </div>
        ) : null}
      </footer>
    </div>,
    document.body,
  );
}

function getVideoEmbedUrl(provider: string, externalUrl: string | null) {
  if (!externalUrl) return null;

  try {
    const url = new URL(externalUrl);
    if (provider === "youtube") {
      const videoId =
        url.hostname === "youtu.be"
          ? url.pathname.split("/").filter(Boolean)[0]
          : url.searchParams.get("v") ?? url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
      return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
    }

    if (provider === "vimeo") {
      const videoId = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
}
