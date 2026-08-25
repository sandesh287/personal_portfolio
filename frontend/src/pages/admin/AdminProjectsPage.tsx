import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Edit3,
  ExternalLink,
  Film,
  FolderKanban,
  ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
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
import { SortableList } from "@/components/ui/SortableList";
import { useMediaList } from "@/features/media";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  useAdminProjects,
  useAttachProjectImage,
  useAttachProjectVideo,
  useCreateExternalProjectVideo,
  useCreateProject,
  useDeleteProject,
  useDeleteProjectImage,
  useDeleteProjectVideo,
  useProjectCategories,
  useProjectImages,
  useProjectVideos,
  useReorderProjectImages,
  useReorderProjectVideos,
  useUpdateProjectImage,
  useUpdateProjectVideo,
  useTechnologies,
  useSetProjectCoverImage,
  useUpdateProject,
  useUploadProjectImage,
} from "@/features/projects";
import type {
  Project,
  ProjectCategory,
  ProjectCreatePayload,
  ProjectImage,
  ProjectStatus,
  ProjectVideo,
  Technology,
} from "@/features/projects";
import { cn } from "@/utils/cn";
import { getErrorMessage } from "@/utils/errors";

const ADMIN_PAGE_SIZE = 10;
type StatusFilter = "all" | ProjectStatus;

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

const statusOptions: StatusFilter[] = ["all", "published", "draft", "archived"];

export function AdminProjectsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [mediaProject, setMediaProject] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  const queryParams = {
    page,
    pageSize: ADMIN_PAGE_SIZE,
    search: search.trim() || undefined,
    status: status === "all" ? undefined : status,
    sort: "updatedAt" as const,
    order: "desc" as const,
  };

  const projectsQuery = useAdminProjects(queryParams);
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

  function openMediaManager(project: Project) {
    setMediaProject(project);
    setIsMediaOpen(true);
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
                setStatus(event.target.value as StatusFilter);
                setPage(1);
              }}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {formatStatusOption(option)}
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
              title="No projects found"
              description="Create a project or adjust the search and status filters."
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
                            size="sm"
                            leftIcon={<Edit3 className="h-4 w-4" />}
                            onClick={() => openEditForm(project)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            leftIcon={<ImageIcon className="h-4 w-4" />}
                            onClick={() => openMediaManager(project)}
                          >
                            Media
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 className="h-4 w-4" />}
                            onClick={() => void handleDelete(project)}
                            isLoading={deleteProject.isPending}
                          >
                            Delete
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
      <ProjectMediaModal
        project={mediaProject}
        isOpen={isMediaOpen}
        onProjectChange={setMediaProject}
        onClose={() => setIsMediaOpen(false)}
      />
    </section>
  );
}

function ProjectMediaModal({
  project,
  isOpen,
  onProjectChange,
  onClose,
}: {
  project: Project | null;
  isOpen: boolean;
  onProjectChange: (project: Project) => void;
  onClose: () => void;
}) {
  const [mediaMode, setMediaMode] = useState<"images" | "videos">("images");
  const [librarySearch, setLibrarySearch] = useState("");
  const [caption, setCaption] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const imagesQuery = useProjectImages(project?.id);
  const libraryQuery = useMediaList(
    {
      page: 1,
      pageSize: 100,
      search: librarySearch.trim() || undefined,
      contentType: "image",
      sort: "created_at",
      order: "desc",
    },
    isOpen,
  );
  const attachImage = useAttachProjectImage();
  const uploadImage = useUploadProjectImage();
  const setCoverImage = useSetProjectCoverImage();
  const deleteImage = useDeleteProjectImage();
  const updateImage = useUpdateProjectImage();
  const reorderImages = useReorderProjectImages();
  const isSubmitting =
    attachImage.isPending ||
    uploadImage.isPending ||
    setCoverImage.isPending ||
    deleteImage.isPending ||
    updateImage.isPending ||
    reorderImages.isPending;
  const attachedMediaIds = useMemo(
    () => new Set(imagesQuery.data?.map((image) => image.mediaAssetId) ?? []),
    [imagesQuery.data],
  );

  useEffect(() => {
    if (isOpen) {
      setMediaMode("images");
      setCaption("");
      setLibrarySearch("");
      setSortOrder(0);
      setFile(null);
    }
  }, [isOpen]);

  async function handleUpload() {
    if (!project || !file) {
      toast.error("Choose an image before uploading.");
      return;
    }

    try {
      await uploadImage.mutateAsync({
        projectId: project.id,
        file,
        caption: caption.trim() || null,
        sortOrder,
      });
      setCaption("");
      setSortOrder(0);
      setFile(null);
      toast.success("Project image uploaded.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Project image could not be uploaded."));
    }
  }

  async function handleAttach(mediaAssetId: string) {
    if (!project) {
      return;
    }

    try {
      await attachImage.mutateAsync({ projectId: project.id, mediaAssetId });
      toast.success("Image added to project.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Image could not be added to the project."));
    }
  }

  async function handleSetCover(imageId: string | null) {
    if (!project) {
      return;
    }

    try {
      const updatedProject = await setCoverImage.mutateAsync({ projectId: project.id, imageId });
      onProjectChange(updatedProject);
      toast.success(imageId ? "Cover image updated." : "Cover image cleared.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Cover image could not be updated."));
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!project) {
      return;
    }

    const confirmed = window.confirm("Delete this project image?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteImage.mutateAsync({ projectId: project.id, imageId });
      const deletedImage = imagesQuery.data?.find((image) => image.id === imageId);

      if (deletedImage?.mediaAssetId === project.coverImageId) {
        onProjectChange({ ...project, coverImageId: null });
      }

      toast.success("Project image deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Project image could not be deleted."));
    }
  }

  return (
    <Modal
      title="Project media"
      description={project ? `Manage images for ${project.title}.` : undefined}
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-6xl"
    >
      {!project ? null : (
        <div className="space-y-4">
          <div className="inline-flex rounded-md border border-border bg-muted p-1">
            <Button
              type="button"
              size="sm"
              variant={mediaMode === "images" ? "primary" : "ghost"}
              leftIcon={<ImageIcon className="h-4 w-4" />}
              onClick={() => setMediaMode("images")}
            >
              Images
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mediaMode === "videos" ? "primary" : "ghost"}
              leftIcon={<Film className="h-4 w-4" />}
              onClick={() => setMediaMode("videos")}
            >
              Videos
            </Button>
          </div>

          {mediaMode === "images" ? (
            <>
          <section className="border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-foreground">Upload new image</h3>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(15rem,1.4fr)_minmax(12rem,1fr)_6rem_auto] lg:items-end">
              <FormField label="Image file">
                <TextInput
                  type="file"
                  accept="image/*"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </FormField>
              <FormField label="Caption">
                <TextInput
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  placeholder="Optional caption"
                />
              </FormField>
              <FormField label="Order">
                <TextInput
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(event) => setSortOrder(Number(event.target.value))}
                />
              </FormField>
              <Button
                type="button"
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={() => void handleUpload()}
                isLoading={uploadImage.isPending}
                disabled={!file}
              >
                Upload
              </Button>
            </div>
          </section>

          <div className="grid min-h-[28rem] gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.9fr)]">
            <section className="min-w-0 lg:border-r lg:border-border lg:pr-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Media library</h3>
                  <p className="text-xs text-muted-foreground">Choose an existing image to reuse.</p>
                </div>
                <label className="relative w-full sm:w-64">
                  <span className="sr-only">Search media library</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <TextInput
                    value={librarySearch}
                    onChange={(event) => setLibrarySearch(event.target.value)}
                    placeholder="Search images..."
                    className="pl-9"
                  />
                </label>
              </div>

              {libraryQuery.isLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="aspect-[4/3]" />
                  ))}
                </div>
              ) : null}

              {libraryQuery.isError ? (
                <EmptyState
                  title="Media library could not be loaded"
                  description={getErrorMessage(libraryQuery.error)}
                />
              ) : null}

              {!libraryQuery.isLoading && libraryQuery.data?.items.length === 0 ? (
                <EmptyState
                  title="No library images found"
                  description="Upload an image above or adjust your search."
                />
              ) : null}

              {libraryQuery.data?.items.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {libraryQuery.data.items.map((media) => {
                    const isAttached = attachedMediaIds.has(media.id);
                    return (
                      <article
                        key={media.id}
                        className="group overflow-hidden rounded-md border border-border bg-background"
                      >
                        <div className="aspect-[4/3] bg-muted">
                          {media.publicUrl ? (
                            <img
                              src={media.publicUrl}
                              alt={media.altText || media.originalFilename}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                              <ImageIcon className="h-7 w-7" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 p-2">
                          <p className="min-w-0 flex-1 truncate text-xs font-medium" title={media.originalFilename}>
                            {media.originalFilename}
                          </p>
                          <Button
                            type="button"
                            variant={isAttached ? "ghost" : "secondary"}
                            size="sm"
                            leftIcon={isAttached ? <Check className="h-3.5 w-3.5" /> : undefined}
                            disabled={isAttached || isSubmitting}
                            onClick={() => void handleAttach(media.id)}
                          >
                            {isAttached ? "Added" : "Add"}
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </section>

            <ProjectGallerySection
              project={project}
              imagesQuery={imagesQuery}
              isSubmitting={isSubmitting}
              onSetCover={handleSetCover}
              onDeleteImage={handleDeleteImage}
              updateImage={updateImage}
              reorderImages={reorderImages}
            />
          </div>
            </>
          ) : (
            <ProjectVideosWorkspace project={project} isOpen={isOpen} />
          )}
        </div>
      )}
    </Modal>
  );
}

function ProjectVideosWorkspace({ project, isOpen }: { project: Project; isOpen: boolean }) {
  const [search, setSearch] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [title, setTitle] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [orderedVideos, setOrderedVideos] = useState<ProjectVideo[]>([]);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const videosQuery = useProjectVideos(project.id);
  const libraryQuery = useMediaList(
    {
      page: 1,
      pageSize: 100,
      search: search.trim() || undefined,
      contentType: "video",
      sort: "created_at",
      order: "desc",
    },
    isOpen,
  );
  const attachVideo = useAttachProjectVideo();
  const createExternalVideo = useCreateExternalProjectVideo();
  const deleteVideo = useDeleteProjectVideo();
  const updateVideo = useUpdateProjectVideo();
  const reorderVideos = useReorderProjectVideos();
  const attachedMediaIds = useMemo(
    () => new Set(videosQuery.data?.flatMap((video) => video.mediaAssetId ?? []) ?? []),
    [videosQuery.data],
  );
  const isSubmitting =
    attachVideo.isPending ||
    createExternalVideo.isPending ||
    deleteVideo.isPending ||
    updateVideo.isPending ||
    reorderVideos.isPending;

  useEffect(() => {
    if (videosQuery.data) {
      setOrderedVideos((current) =>
        hasOrderChanged
          ? mergeRefreshedItemsPreservingOrder(current, videosQuery.data)
          : videosQuery.data,
      );
    }
  }, [hasOrderChanged, videosQuery.data]);

  function startEditing(video: ProjectVideo) {
    setEditingVideoId(video.id);
    setEditTitle(video.title ?? "");
    setEditCaption(video.caption ?? "");
  }

  async function handleUpdate() {
    if (!editingVideoId) {
      return;
    }
    try {
      await updateVideo.mutateAsync({
        projectId: project.id,
        videoId: editingVideoId,
        title: editTitle.trim() || null,
        caption: editCaption.trim() || null,
      });
      setEditingVideoId(null);
      toast.success("Video details updated.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Video details could not be updated."));
    }
  }

  async function handleAttach(mediaAssetId: string) {
    try {
      await attachVideo.mutateAsync({ projectId: project.id, mediaAssetId });
      toast.success("Video added to project.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Video could not be added to the project."));
    }
  }

  async function handleCreateExternalVideo() {
    const normalizedUrl = externalUrl.trim();
    if (!normalizedUrl) {
      toast.error("Enter a YouTube or Vimeo URL.");
      return;
    }

    try {
      await createExternalVideo.mutateAsync({
        projectId: project.id,
        externalUrl: normalizedUrl,
        title: title.trim() || null,
        sortOrder,
      });
      setExternalUrl("");
      setTitle("");
      setSortOrder(0);
      toast.success("External video added.");
    } catch (error) {
      toast.error(getErrorMessage(error, "External video could not be added."));
    }
  }

  async function handleDelete(videoId: string) {
    if (!window.confirm("Remove this video from the project?")) {
      return;
    }
    try {
      await deleteVideo.mutateAsync({ projectId: project.id, videoId });
      toast.success("Video removed from project.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Video could not be removed."));
    }
  }

  async function handleSaveVideoOrder() {
    try {
      await reorderVideos.mutateAsync({
        projectId: project.id,
        items: orderedVideos.map((v, index) => ({ id: v.id, sortOrder: index })),
      });
      setHasOrderChanged(false);
      toast.success("Video order saved.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Video order could not be saved."));
    }
  }

  return (
    <div className="space-y-4">
      <section className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">Add external video</h3>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(15rem,1.5fr)_minmax(12rem,1fr)_6rem_auto] lg:items-end">
          <FormField label="YouTube or Vimeo URL">
            <TextInput
              type="url"
              value={externalUrl}
              onChange={(event) => setExternalUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </FormField>
          <FormField label="Title">
            <TextInput
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional title"
            />
          </FormField>
          <FormField label="Order">
            <TextInput
              type="number"
              min={0}
              value={sortOrder}
              onChange={(event) => setSortOrder(Number(event.target.value))}
            />
          </FormField>
          <Button
            type="button"
            leftIcon={<ExternalLink className="h-4 w-4" />}
            disabled={!externalUrl.trim()}
            isLoading={createExternalVideo.isPending}
            onClick={() => void handleCreateExternalVideo()}
          >
            Add link
          </Button>
        </div>
      </section>

      <div className="grid min-h-[28rem] gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.9fr)]">
        <section className="min-w-0 lg:border-r lg:border-border lg:pr-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Video library</h3>
              <p className="text-xs text-muted-foreground">Reuse videos uploaded to Media Library.</p>
            </div>
            <label className="relative w-full sm:w-64">
              <span className="sr-only">Search video library</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <TextInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search videos..."
                className="pl-9"
              />
            </label>
          </div>

          {libraryQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[4/3]" />
              ))}
            </div>
          ) : null}
          {libraryQuery.isError ? (
            <EmptyState title="Video library could not be loaded" description={getErrorMessage(libraryQuery.error)} />
          ) : null}
          {!libraryQuery.isLoading && libraryQuery.data?.items.length === 0 ? (
            <EmptyState
              title="No library videos found"
              description="Upload video files from the Media Library, then return here to attach them."
            />
          ) : null}
          {libraryQuery.data?.items.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {libraryQuery.data.items.map((media) => {
                const isAttached = attachedMediaIds.has(media.id);
                return (
                  <article key={media.id} className="overflow-hidden rounded-md border border-border bg-background">
                    <div className="flex aspect-[4/3] items-center justify-center bg-muted text-muted-foreground">
                      <Film className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <div className="flex items-center gap-2 p-2">
                      <p className="min-w-0 flex-1 truncate text-xs font-medium" title={media.originalFilename}>
                        {media.originalFilename}
                      </p>
                      <Button
                        type="button"
                        variant={isAttached ? "ghost" : "secondary"}
                        size="sm"
                        leftIcon={isAttached ? <Check className="h-3.5 w-3.5" /> : undefined}
                        disabled={isAttached || isSubmitting}
                        onClick={() => void handleAttach(media.id)}
                      >
                        {isAttached ? "Added" : "Add"}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>

        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Project videos</h3>
              <p className="text-xs text-muted-foreground">{orderedVideos.length} attached</p>
            </div>
            {hasOrderChanged ? (
              <Button
                type="button"
                size="sm"
                leftIcon={<Save className="h-3.5 w-3.5" />}
                isLoading={reorderVideos.isPending}
                onClick={() => void handleSaveVideoOrder()}
              >
                Save order
              </Button>
            ) : null}
          </div>
          {videosQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : null}
          {videosQuery.isError ? (
            <EmptyState title="Videos could not be loaded" description={getErrorMessage(videosQuery.error)} />
          ) : null}
          {!videosQuery.isLoading && orderedVideos.length === 0 && !videosQuery.isError ? (
            <EmptyState
              title="No project videos"
              description="Add a library video or an external YouTube/Vimeo link."
            />
          ) : null}
          {orderedVideos.length > 0 ? (
            <SortableList
              items={orderedVideos}
              onReorder={(reordered) => {
                setOrderedVideos(reordered);
                setHasOrderChanged(true);
              }}
              disabled={isSubmitting}
              renderItem={(video) => (
                <article className="flex gap-3 rounded-md border border-border bg-background p-3">
                  <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                    <Film className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {video.title ||
                            (video.provider === "local"
                              ? "Uploaded video"
                              : video.provider === "youtube"
                                ? "YouTube video"
                                : "Vimeo video")}
                        </p>
                        <p className="text-xs text-muted-foreground">{video.provider}</p>
                      </div>
                      {video.url ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(video.url ?? "", "_blank", "noopener,noreferrer")}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open video
                        </Button>
                      ) : null}
                    </div>
                    {editingVideoId === video.id ? (
                      <div className="mt-3 space-y-2 border-t border-border pt-3">
                        <TextInput
                          value={editTitle}
                          onChange={(event) => setEditTitle(event.target.value)}
                          placeholder="Video title"
                        />
                        <TextInput
                          value={editCaption}
                          onChange={(event) => setEditCaption(event.target.value)}
                          placeholder="Optional caption"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            isLoading={updateVideo.isPending}
                            onClick={() => void handleUpdate()}
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingVideoId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => startEditing(video)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={isSubmitting}
                          onClick={() => void handleDelete(video.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              )}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}

function ProjectGallerySection({
  project,
  imagesQuery,
  isSubmitting,
  onSetCover,
  onDeleteImage,
  updateImage,
  reorderImages,
}: {
  project: Project;
  imagesQuery: ReturnType<typeof useProjectImages>;
  isSubmitting: boolean;
  onSetCover: (imageId: string | null) => void;
  onDeleteImage: (imageId: string) => void;
  updateImage: ReturnType<typeof useUpdateProjectImage>;
  reorderImages: ReturnType<typeof useReorderProjectImages>;
}) {
  const [orderedImages, setOrderedImages] = useState<ProjectImage[]>([]);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");

  useEffect(() => {
    if (imagesQuery.data) {
      setOrderedImages((current) =>
        hasOrderChanged
          ? mergeRefreshedItemsPreservingOrder(current, imagesQuery.data)
          : imagesQuery.data,
      );
    }
  }, [hasOrderChanged, imagesQuery.data]);

  function startEditingImage(image: ProjectImage) {
    setEditingImageId(image.id);
    setEditCaption(image.caption ?? "");
  }

  async function handleSaveCaption(imageId: string) {
    try {
      await updateImage.mutateAsync({
        projectId: project.id,
        imageId,
        caption: editCaption.trim() || null,
      });
      setEditingImageId(null);
      toast.success("Image caption updated.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Caption could not be updated."));
    }
  }

  async function handleSaveImageOrder() {
    try {
      await reorderImages.mutateAsync({
        projectId: project.id,
        items: orderedImages.map((img, index) => ({ id: img.id, sortOrder: index })),
      });
      setHasOrderChanged(false);
      toast.success("Image order saved.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Image order could not be saved."));
    }
  }

  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Project gallery</h3>
          <p className="text-xs text-muted-foreground">
            {orderedImages.length} attached
          </p>
        </div>
        <div className="flex gap-2">
          {hasOrderChanged ? (
            <Button
              type="button"
              size="sm"
              leftIcon={<Save className="h-3.5 w-3.5" />}
              isLoading={reorderImages.isPending}
              onClick={() => void handleSaveImageOrder()}
            >
              Save order
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void onSetCover(null)}
            disabled={!project.coverImageId || isSubmitting}
          >
            Clear cover
          </Button>
        </div>
      </div>

      {imagesQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : null}

      {imagesQuery.isError ? (
        <EmptyState title="Gallery could not be loaded" description={getErrorMessage(imagesQuery.error)} />
      ) : null}

      {!imagesQuery.isLoading && orderedImages.length === 0 && !imagesQuery.isError ? (
        <EmptyState
          title="No images attached"
          description="Add an image from the library to build this project gallery."
        />
      ) : null}

      {orderedImages.length > 0 ? (
        <SortableList
          items={orderedImages}
          onReorder={(reordered) => {
            setOrderedImages(reordered);
            setHasOrderChanged(true);
          }}
          disabled={isSubmitting}
          renderItem={(image) => {
            const isCover = project.coverImageId === image.mediaAssetId;
            return (
              <article
                className={cn(
                  "flex gap-3 rounded-md border bg-background p-2",
                  isCover ? "border-primary" : "border-border",
                )}
              >
                {image.url ? (
                  <img
                    src={image.url}
                    alt={image.caption ?? ""}
                    className="h-20 w-24 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                    <ImageIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                  {editingImageId === image.id ? (
                    <div className="space-y-2">
                      <TextInput
                        value={editCaption}
                        onChange={(event) => setEditCaption(event.target.value)}
                        placeholder="Image caption"
                      />
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          isLoading={updateImage.isPending}
                          onClick={() => void handleSaveCaption(image.id)}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingImageId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="truncate text-sm font-medium text-foreground">
                          {image.caption || "Project image"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          variant={isCover ? "primary" : "secondary"}
                          size="sm"
                          onClick={() => void onSetCover(image.id)}
                          disabled={isCover || isSubmitting}
                        >
                          {isCover ? "Cover" : "Set cover"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => startEditingImage(image)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void onDeleteImage(image.id)}
                          disabled={isSubmitting}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </article>
            );
          }}
        />
      ) : null}
    </section>
  );
}

function mergeRefreshedItemsPreservingOrder<T extends { id: string }>(
  current: T[],
  refreshed: T[],
) {
  const refreshedById = new Map(refreshed.map((item) => [item.id, item]));
  const currentIds = new Set(current.map((item) => item.id));
  const retainedItems = current.flatMap((item) => {
    const refreshedItem = refreshedById.get(item.id);
    return refreshedItem ? [refreshedItem] : [];
  });
  const newItems = refreshed.filter((item) => !currentIds.has(item.id));
  return [...retainedItems, ...newItems];
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
      <form className="space-y-3" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <div className="grid gap-3 md:grid-cols-2">
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

        <div className="grid gap-3 md:grid-cols-3">
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
          <div className="mt-3 grid max-h-40 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
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

        <div className="grid gap-3 md:grid-cols-3">
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

function formatStatusOption(status: StatusFilter) {
  if (status === "all") {
    return "All statuses";
  }

  return `${status[0].toUpperCase()}${status.slice(1)}`;
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
