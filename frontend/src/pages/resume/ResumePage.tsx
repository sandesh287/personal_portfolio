import { Download, ExternalLink, FileText } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { resumeApi, useActiveResume } from "@/features/resume";
import { getErrorMessage } from "@/utils/errors";

export function ResumePage() {
  const query = useActiveResume();

  if (query.isLoading) return <ResumeSkeleton />;
  if (query.isError) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          title="Resume is not available"
          description={getErrorMessage(query.error, "The active resume could not be loaded.")}
        />
      </div>
    );
  }
  if (!query.data) return null;

  const resume = query.data;
  return (
    <section className="flex min-h-[calc(100dvh-7rem)] flex-col bg-surface">
      <header className="flex flex-col gap-4 border-b border-border p-4 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-muted-foreground">Document workspace</p>
          <h1 className="mt-2 break-words text-2xl font-semibold text-foreground">
            {resume.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Version {resume.version} · {formatBytes(resume.sizeBytes)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={resume.publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-muted px-4 text-sm font-medium text-foreground hover:bg-muted/80"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> Open
          </a>
          <a
            href={resumeApi.downloadUrl}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4" aria-hidden="true" /> Download
          </a>
        </div>
      </header>
      <div className="min-h-0 flex-1 p-2 sm:p-4 lg:p-6">
        <object
          data={`${resume.publicUrl}#view=FitH`}
          type="application/pdf"
          aria-label={`${resume.title} PDF viewer`}
          className="h-[calc(100dvh-14rem)] min-h-[32rem] w-full rounded-md border border-border bg-background"
        >
          <div className="flex h-full min-h-[32rem] flex-col items-center justify-center gap-3 p-6 text-center">
            <FileText className="h-10 w-10 text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              This browser cannot display the PDF inline. Open or download it instead.
            </p>
          </div>
        </object>
      </div>
    </section>
  );
}

function ResumeSkeleton() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Skeleton className="h-8 w-64 max-w-full" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-[65dvh] min-h-[28rem] w-full" />
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
