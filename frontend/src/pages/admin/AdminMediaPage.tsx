import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileImage,
  FileVideo,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FormField, TextInput } from "@/components/form/FormField";
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
  useMediaList,
  useUploadMedia,
  useUpdateMedia,
  useDeleteMedia,
} from "@/features/media";
import type { MediaAsset } from "@/features/media";
import { getErrorMessage } from "@/utils/errors";

const ADMIN_PAGE_SIZE = 20;

const uploadFormSchema = z.object({
  file: z.instanceof(File, { message: "File is required" }),
  altText: z.string().max(255).optional(),
  folder: z.string().max(120).optional(),
});

const updateFormSchema = z.object({
  altText: z.string().max(255).optional(),
  folder: z.string().max(120).optional(),
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;
type UpdateFormValues = z.infer<typeof updateFormSchema>;

export function AdminMediaPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("");
  const [editingMedia, setEditingMedia] = useState<MediaAsset | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const queryParams = {
    page,
    pageSize: ADMIN_PAGE_SIZE,
    search: search || undefined,
    contentType: contentTypeFilter || undefined,
    sort: "created_at",
    order: "desc" as const,
  };

  const { data, isError, isLoading, refetch } = useMediaList(queryParams);
  const uploadMutation = useUploadMedia();
  const updateMutation = useUpdateMedia();
  const deleteMutation = useDeleteMedia();

  const uploadForm = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      altText: "",
      folder: "",
    },
  });

  const editForm = useForm<UpdateFormValues>({
    resolver: zodResolver(updateFormSchema),
  });

  const handleOpenUpload = () => {
    setIsUploadOpen(true);
    setSelectedFile(null);
    uploadForm.reset();
  };

  const handleCloseUpload = () => {
    setIsUploadOpen(false);
    setSelectedFile(null);
    uploadForm.reset();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      uploadForm.setValue("file", file);
      uploadForm.clearErrors("file");
    }
  };

  const handleUpload = async (values: UploadFormValues) => {
    try {
      await uploadMutation.mutateAsync({
        file: values.file,
        altText: values.altText,
        folder: values.folder,
      });
      toast.success("Media uploaded successfully");
      handleCloseUpload();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleOpenEdit = (media: MediaAsset) => {
    setEditingMedia(media);
    setIsEditOpen(true);
    editForm.reset({
      altText: media.altText || "",
      folder: media.folder || "",
    });
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setEditingMedia(null);
    editForm.reset();
  };

  const handleUpdate = async (values: UpdateFormValues) => {
    if (!editingMedia) return;

    try {
      await updateMutation.mutateAsync({
        id: editingMedia.id,
        data: values,
      });
      toast.success("Media updated successfully");
      handleCloseEdit();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (media: MediaAsset) => {
    if (!confirm(`Delete ${media.originalFilename}?`)) return;

    try {
      await deleteMutation.mutateAsync(media.id);
      toast.success("Media deleted successfully");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMediaIcon = (contentType: string) => {
    if (contentType.startsWith("image/")) return <FileImage className="h-8 w-8" />;
    if (contentType.startsWith("video/")) return <FileVideo className="h-8 w-8" />;
    return <FileImage className="h-8 w-8" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Media Library</h1>
          <p className="text-muted-foreground">
            Manage uploaded assets for projects, blog posts, and more
          </p>
        </div>
        <Button onClick={handleOpenUpload} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Upload Media
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Media Assets</CardTitle>
              <CardDescription>
                {data?.meta.totalItems || 0} total assets
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by filename or alt text..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm"
              />
            </div>
            <select
              value={contentTypeFilter}
              onChange={(e) => {
                setContentTypeFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-auto"
            >
              <option value="">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="application/pdf">PDFs</option>
            </select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileImage className="mb-4 h-12 w-12 text-destructive" />
              <h3 className="text-lg font-medium">Unable to load media</h3>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                The media library could not be loaded. Try again.
              </p>
              <Button variant="secondary" onClick={() => void refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : !data?.items?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileImage className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No media found</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Upload your first media asset to get started
              </p>
              <Button onClick={handleOpenUpload}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Media
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {data?.items?.map((media) => (
                  <Card key={media.id} className="overflow-hidden">
                    <div className="aspect-square bg-muted flex items-center justify-center p-4">
                      {media.contentType?.startsWith("image/") && media.publicUrl ? (
                        <img
                          src={media.publicUrl}
                          alt={media.altText || media.originalFilename}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="text-muted-foreground">
                          {getMediaIcon(media.contentType || "")}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <p
                        className="truncate text-sm font-medium"
                        title={media.originalFilename}
                      >
                        {media.originalFilename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(media.sizeBytes)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(media)}
                          className="flex-1"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(media)}
                          disabled={deleteMutation.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {data?.meta && data.meta.totalPages > 1 && (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {data.meta.page} of {data.meta.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!data.meta.hasPreviousPage}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!data.meta.hasNextPage}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isUploadOpen} onClose={handleCloseUpload} title="Upload Media">
        <form onSubmit={uploadForm.handleSubmit(handleUpload)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select File</label>
            <input
              type="file"
              accept="image/*,video/*,application/pdf"
              onChange={handleFileSelect}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {uploadForm.formState.errors.file && (
              <p className="text-sm text-destructive mt-1">
                {uploadForm.formState.errors.file.message}
              </p>
            )}
            {selectedFile && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          <FormField
            label="Alt Text (optional)"
            error={uploadForm.formState.errors.altText?.message}
          >
            <TextInput {...uploadForm.register("altText")} placeholder="Describe this media" />
          </FormField>

          <FormField label="Folder" error={uploadForm.formState.errors.folder?.message}>
            <TextInput {...uploadForm.register("folder")} placeholder="projects" />
          </FormField>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={handleCloseUpload}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} title="Edit Media">
        <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
          {editingMedia && (
            <div className="mb-4">
              <p className="text-sm font-medium">{editingMedia.originalFilename}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(editingMedia.sizeBytes)} • {editingMedia.contentType}
              </p>
            </div>
          )}

          <FormField label="Alt Text" error={editForm.formState.errors.altText?.message}>
            <TextInput {...editForm.register("altText")} placeholder="Describe this media" />
          </FormField>

          <FormField label="Folder" error={editForm.formState.errors.folder?.message}>
            <TextInput {...editForm.register("folder")} placeholder="projects" />
          </FormField>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={handleCloseEdit}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
