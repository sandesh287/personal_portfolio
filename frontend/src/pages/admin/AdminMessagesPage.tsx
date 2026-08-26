import { Archive, ArrowLeft, Inbox, MailOpen, Reply, Search, Star, Trash2 } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDeleteMessage, useMessage, useMessages, useUpdateMessage } from "@/features/messages";
import type { ContactMessage, MessageListParams } from "@/features/messages";
import { cn } from "@/utils/cn";
import { getErrorMessage } from "@/utils/errors";

type InboxFilter = "inbox" | "unread" | "starred" | "archived";
const PAGE_SIZE = 20;

export function AdminMessagesPage() {
  const [filter, setFilter] = useState<InboxFilter>("inbox");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search.trim());
  const params = buildListParams(filter, deferredSearch, page);
  const list = useMessages(params);
  const detail = useMessage(selectedId);
  const update = useUpdateMessage();
  const remove = useDeleteMessage();

  useEffect(() => setPage(1), [deferredSearch, filter]);

  async function selectMessage(message: ContactMessage) {
    setSelectedId(message.id);
    if (!message.read) {
      try {
        await update.mutateAsync({ id: message.id, payload: { read: true } });
      } catch (error) {
        toast.error(getErrorMessage(error, "Message could not be marked as read."));
      }
    }
  }

  async function updateState(payload: { read?: boolean; archived?: boolean; starred?: boolean }) {
    if (!selectedId) return;
    try {
      await update.mutateAsync({ id: selectedId, payload });
      if (payload.archived !== undefined) setSelectedId(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Message could not be updated."));
    }
  }

  async function deleteSelected() {
    if (!selectedId || !window.confirm("Delete this message permanently?")) return;
    try {
      await remove.mutateAsync(selectedId);
      setSelectedId(null);
      toast.success("Message deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Message could not be deleted."));
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-md border border-border bg-background">
      <header className="flex flex-col gap-3 border-b border-border p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">Communications</p>
          <h1 className="mt-1 text-xl font-semibold text-foreground">Message inbox</h1>
        </div>
        <label className="relative w-full lg:max-w-sm">
          <span className="sr-only">Search messages</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search messages..."
            className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </header>

      <div className="grid min-h-0 flex-1 xl:grid-cols-[13rem_22rem_minmax(0,1fr)]">
        <nav
          className="flex gap-1 overflow-x-auto border-b border-border bg-muted/40 p-2 xl:flex-col xl:border-b-0 xl:border-r xl:p-3"
          aria-label="Message filters"
        >
          <FilterButton
            label="Inbox"
            icon={<Inbox className="h-4 w-4" />}
            active={filter === "inbox"}
            onClick={() => {
              setFilter("inbox");
              setSelectedId(null);
            }}
          />
          <FilterButton
            label="Unread"
            icon={<MailOpen className="h-4 w-4" />}
            active={filter === "unread"}
            onClick={() => {
              setFilter("unread");
              setSelectedId(null);
            }}
          />
          <FilterButton
            label="Starred"
            icon={<Star className="h-4 w-4" />}
            active={filter === "starred"}
            onClick={() => {
              setFilter("starred");
              setSelectedId(null);
            }}
          />
          <FilterButton
            label="Archived"
            icon={<Archive className="h-4 w-4" />}
            active={filter === "archived"}
            onClick={() => {
              setFilter("archived");
              setSelectedId(null);
            }}
          />
        </nav>

        <section
          className={cn(
            "min-h-0 border-border xl:border-r",
            selectedId ? "hidden xl:flex xl:flex-col" : "flex flex-col",
          )}
        >
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
            <h2 className="text-sm font-semibold capitalize text-foreground">{filter}</h2>
            <span className="text-xs text-muted-foreground">
              {list.data?.meta.totalItems ?? 0} messages
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {list.isLoading ? <MessageListSkeleton /> : null}
            {list.isError ? (
              <div className="p-4">
                <EmptyState
                  title="Messages could not be loaded"
                  description={getErrorMessage(list.error)}
                />
              </div>
            ) : null}
            {!list.isLoading && !list.isError && list.data?.items.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No messages found"
                  description="Try another inbox filter or search term."
                />
              </div>
            ) : null}
            {list.data?.items.map((message) => (
              <button
                key={message.id}
                type="button"
                onClick={() => void selectMessage(message)}
                className={cn(
                  "relative block w-full border-b border-border p-4 text-left hover:bg-muted/60",
                  selectedId === message.id && "bg-muted",
                  !message.read && "bg-primary/[0.04]",
                )}
              >
                {!message.read ? (
                  <span className="absolute inset-y-0 left-0 w-1 bg-primary" />
                ) : null}
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <p
                    className={cn(
                      "truncate text-sm text-foreground",
                      !message.read && "font-semibold",
                    )}
                  >
                    {message.name}
                  </p>
                  <time className="shrink-0 text-[11px] text-muted-foreground">
                    {formatRelativeDate(message.createdAt)}
                  </time>
                </div>
                <p className="mt-1 truncate text-sm font-medium text-foreground">
                  {message.subject}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {message.message}
                </p>
              </button>
            ))}
          </div>
          {list.data && list.data.meta.totalPages > 1 ? (
            <div className="flex shrink-0 items-center justify-between border-t border-border p-3">
              <Button
                size="sm"
                variant="ghost"
                disabled={!list.data.meta.hasPreviousPage}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                {page} / {list.data.meta.totalPages}
              </span>
              <Button
                size="sm"
                variant="ghost"
                disabled={!list.data.meta.hasNextPage}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </section>

        <MessageDetail
          message={detail.data ?? null}
          loading={detail.isLoading}
          error={detail.isError ? detail.error : null}
          visible={Boolean(selectedId)}
          busy={update.isPending || remove.isPending}
          onBack={() => setSelectedId(null)}
          onArchive={(archived) => void updateState({ archived })}
          onRead={(read) => void updateState({ read })}
          onStar={(starred) => void updateState({ starred })}
          onDelete={() => void deleteSelected()}
        />
      </div>
    </div>
  );
}

function MessageDetail({
  message,
  loading,
  error,
  visible,
  busy,
  onBack,
  onArchive,
  onRead,
  onStar,
  onDelete,
}: {
  message: ContactMessage | null;
  loading: boolean;
  error: unknown;
  visible: boolean;
  busy: boolean;
  onBack: () => void;
  onArchive: (value: boolean) => void;
  onRead: (value: boolean) => void;
  onStar: (value: boolean) => void;
  onDelete: () => void;
}) {
  if (!visible)
    return (
      <div className="hidden min-h-0 items-center justify-center p-8 xl:flex">
        <EmptyState
          title="Select a message"
          description="Choose a conversation from the inbox to inspect it."
        />
      </div>
    );
  if (loading)
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  if (error || !message)
    return (
      <div className="p-4">
        <EmptyState title="Message could not be loaded" description={getErrorMessage(error)} />
      </div>
    );

  return (
    <section className="flex min-h-0 flex-col">
      <div className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b border-border p-2 sm:px-4">
        <Button
          size="icon"
          variant="ghost"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={onBack}
          className="xl:hidden"
        >
          Back to inbox
        </Button>
        <a
          href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
        >
          <Reply className="h-4 w-4" /> Reply
        </a>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          leftIcon={<Archive className="h-4 w-4" />}
          onClick={() => onArchive(!message.archived)}
        >
          {message.archived ? "Restore" : "Archive"}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          disabled={busy}
          leftIcon={
            <Star className={cn("h-4 w-4", message.starred && "fill-current text-primary")} />
          }
          onClick={() => onStar(!message.starred)}
        >
          Toggle star
        </Button>
        <Button
          size="icon"
          variant="ghost"
          disabled={busy}
          leftIcon={<MailOpen className="h-4 w-4" />}
          onClick={() => onRead(!message.read)}
        >
          {message.read ? "Mark unread" : "Mark read"}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          disabled={busy}
          leftIcon={<Trash2 className="h-4 w-4 text-destructive" />}
          onClick={onDelete}
        >
          Delete message
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="break-words text-xl font-semibold text-foreground">
                {message.subject}
              </h2>
              <p className="mt-3 text-sm font-medium text-foreground">{message.name}</p>
              <a
                href={`mailto:${message.email}`}
                className="break-all text-sm text-primary hover:underline"
              >
                {message.email}
              </a>
            </div>
            <time className="shrink-0 text-xs text-muted-foreground">
              {formatFullDate(message.createdAt)}
            </time>
          </div>
          <div className="whitespace-pre-wrap break-words py-6 text-sm leading-7 text-foreground">
            {message.message}
          </div>
          <dl className="grid gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:grid-cols-2">
            <div>
              <dt className="font-medium uppercase">Source</dt>
              <dd className="mt-1">{message.source.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt className="font-medium uppercase">Message ID</dt>
              <dd className="mt-1 break-all font-mono">{message.id}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

function FilterButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function MessageListSkeleton() {
  return (
    <div>
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="space-y-2 border-b border-border p-4">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

function buildListParams(filter: InboxFilter, search: string, page: number): MessageListParams {
  return {
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    archived: filter === "archived",
    read: filter === "unread" ? false : undefined,
    starred: filter === "starred" ? true : undefined,
    sort: "createdAt",
    order: "desc",
  };
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date)
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}
function formatFullDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}
