import { Download, FilePlus2, FileText, Star, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { FormActions } from "@/components/form/FormActions";
import { FormField, TextInput } from "@/components/form/FormField";
import { Textarea } from "@/components/form/Textarea";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useActivateResume,
  useDeleteResume,
  useResumeVersions,
  useUploadResume,
} from "@/features/resume";
import type { ResumeVersion } from "@/features/resume";
import { getErrorMessage } from "@/utils/errors";

export function AdminResumePage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const query = useResumeVersions();
  const activate = useActivateResume();
  const remove = useDeleteResume();

  async function handleActivate(resume: ResumeVersion) {
    try {
      await activate.mutateAsync(resume.id);
      toast.success(`${resume.version} is now the active resume.`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Resume could not be activated."));
    }
  }

  async function handleDelete(resume: ResumeVersion) {
    if (!window.confirm(`Delete resume version ${resume.version}?`)) return;
    try {
      await remove.mutateAsync(resume.id);
      toast.success("Resume version deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Resume version could not be deleted."));
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">Document control</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Resume management</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload PDF versions and choose which one appears in the public workspace.
          </p>
        </div>
        <Button
          leftIcon={<FilePlus2 className="h-4 w-4" aria-hidden="true" />}
          onClick={() => setIsUploadOpen(true)}
        >
          Upload version
        </Button>
      </header>

      {query.isLoading ? <VersionSkeleton /> : null}
      {query.isError ? (
        <EmptyState
          title="Resume history could not be loaded"
          description={getErrorMessage(query.error)}
        />
      ) : null}
      {!query.isLoading && !query.isError && query.data?.length === 0 ? (
        <EmptyState
          title="No resume versions"
          description="Upload the first PDF to make the public resume workspace available."
        />
      ) : null}
      {query.data?.length ? (
        <div className="grid gap-3">
          {query.data.map((resume) => (
            <article
              key={resume.id}
              className="flex min-w-0 flex-col gap-4 rounded-md border border-border bg-background p-4 lg:flex-row lg:items-center"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="break-words font-medium text-foreground">{resume.title}</h2>
                  {resume.isActive ? (
                    <span className="rounded-sm bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      Active
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 break-all text-xs text-muted-foreground">
                  {resume.version} · {resume.filename} · {formatDate(resume.createdAt)} ·{" "}
                  {resume.downloadCount} downloads
                </p>
                {resume.notes ? (
                  <p className="mt-2 text-sm text-muted-foreground">{resume.notes}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <a
                  href={resume.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-muted px-3 text-xs font-medium text-foreground hover:bg-muted/80"
                >
                  <Download className="h-4 w-4" aria-hidden="true" /> View
                </a>
                {!resume.isActive ? (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Star className="h-4 w-4" aria-hidden="true" />}
                      isLoading={activate.isPending}
                      onClick={() => void handleActivate(resume)}
                    >
                      Set active
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      leftIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => void handleDelete(resume)}
                    >
                      Delete version
                    </Button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <UploadResumeModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
}

function UploadResumeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const upload = useUploadResume();
  const [file, setFile] = useState<File | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!file) return;
    try {
      await upload.mutateAsync({
        file,
        title: String(form.get("title")),
        version: String(form.get("version")),
        notes: String(form.get("notes") ?? "") || undefined,
        isActive: form.get("isActive") === "on",
      });
      toast.success("Resume version uploaded.");
      setFile(null);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Resume could not be uploaded."));
    }
  }

  return (
    <Modal
      title="Upload resume version"
      description="PDF files use the configured local or Cloudinary storage provider."
      isOpen={isOpen}
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <FormField label="PDF file">
          <TextInput
            type="file"
            accept="application/pdf,.pdf"
            required
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="py-2"
          />
        </FormField>
        <FormField label="Title">
          <TextInput
            name="title"
            minLength={2}
            maxLength={160}
            defaultValue="Sandesh Resume"
            required
          />
        </FormField>
        <FormField label="Version">
          <TextInput name="version" maxLength={40} placeholder="2026.1" required />
        </FormField>
        <FormField label="Release notes">
          <Textarea
            name="notes"
            maxLength={2000}
            rows={4}
            placeholder="What changed in this version?"
          />
        </FormField>
        <label className="flex min-h-10 items-center gap-3 text-sm text-foreground">
          <input name="isActive" type="checkbox" className="h-4 w-4 accent-primary" />
          Make this the active public resume
        </label>
        <FormActions>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={upload.isPending} disabled={!file}>
            Upload PDF
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}

function VersionSkeleton() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-28 w-full" />
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
