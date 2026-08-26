import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Clock3, Code2, Mail, Send, Share2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormField, TextInput } from "@/components/form/FormField";
import { Textarea } from "@/components/form/Textarea";
import { Button } from "@/components/ui/Button";
import { useCreateMessage } from "@/features/messages";
import { usePublicSettings } from "@/features/settings";
import { getErrorMessage } from "@/utils/errors";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(160),
  email: z.string().trim().email("Enter a valid email address.").max(255),
  subject: z.string().trim().min(3, "Enter a subject.").max(255),
  message: z.string().trim().min(10, "Please add a little more detail.").max(10_000),
  website: z.string().max(500),
});

type ContactValues = z.infer<typeof contactSchema>;

export function ContactPage() {
  const [receiptId, setReceiptId] = useState<string>();
  const createMessage = useCreateMessage();
  const settings = usePublicSettings();
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "", website: "" },
  });

  async function submit(values: ContactValues) {
    setReceiptId(undefined);
    try {
      const receipt = await createMessage.mutateAsync({
        ...values,
        source: "communication_terminal",
      });
      setReceiptId(receipt.id);
      form.reset();
    } catch {
      // Mutation state renders the standardized API error without duplicating toast noise.
    }
  }

  return (
    <section className="min-h-[calc(100dvh-7rem)] bg-surface p-3 sm:p-6">
      <div className="mx-auto flex min-h-[42rem] max-w-6xl flex-col overflow-hidden rounded-md border border-border bg-background shadow-sm">
        <header className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-muted px-4">
          <div className="flex gap-2" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-destructive" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
          </div>
          <p className="truncate px-3 font-mono text-xs text-muted-foreground">
            communication-terminal — sandesh@workspace
          </p>
          <div className="w-12" />
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <main className="min-w-0 p-4 sm:p-6 lg:p-8">
            <p className="font-mono text-sm font-semibold text-primary">
              Welcome to Sandesh&apos;s Communication Terminal
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {settings.data?.tagline ??
                "Send a project inquiry, collaboration proposal, or a simple hello."}
            </p>

            {receiptId ? (
              <div
                className="mt-6 flex items-start gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4"
                role="status"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium text-foreground">Transmission received</p>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    Receipt: {receiptId}
                  </p>
                </div>
              </div>
            ) : null}

            <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(submit)}>
              <FormField label="Name" error={form.formState.errors.name?.message}>
                <TextInput
                  {...form.register("name")}
                  autoComplete="name"
                  hasError={Boolean(form.formState.errors.name)}
                />
              </FormField>
              <FormField label="Email" error={form.formState.errors.email?.message}>
                <TextInput
                  {...form.register("email")}
                  type="email"
                  autoComplete="email"
                  hasError={Boolean(form.formState.errors.email)}
                />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Subject" error={form.formState.errors.subject?.message}>
                  <TextInput
                    {...form.register("subject")}
                    hasError={Boolean(form.formState.errors.subject)}
                  />
                </FormField>
              </div>
              <div className="sm:col-span-2">
                <FormField label="Message" error={form.formState.errors.message?.message}>
                  <Textarea
                    {...form.register("message")}
                    rows={8}
                    hasError={Boolean(form.formState.errors.message)}
                  />
                </FormField>
              </div>
              <div
                className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
                aria-hidden="true"
              >
                <label>
                  Website
                  <input {...form.register("website")} tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              {createMessage.isError ? (
                <p className="text-sm text-destructive sm:col-span-2" role="alert">
                  {getErrorMessage(createMessage.error, "Transmission failed. Please try again.")}
                </p>
              ) : null}
              <div className="flex justify-end sm:col-span-2">
                <Button
                  type="submit"
                  isLoading={createMessage.isPending}
                  leftIcon={<Send className="h-4 w-4" aria-hidden="true" />}
                >
                  Send message
                </Button>
              </div>
            </form>
          </main>

          <aside className="border-t border-border bg-muted/50 p-4 sm:p-6 lg:border-l lg:border-t-0">
            <p className="text-xs font-medium uppercase text-muted-foreground">Persistent links</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {settings.data?.contactEmail ? (
                <ContactLink
                  href={`mailto:${settings.data.contactEmail}`}
                  icon={<Mail className="h-4 w-4" />}
                  label={settings.data.contactEmail}
                />
              ) : (
                <ContactStatus icon={<Mail className="h-4 w-4" />} label="Direct inbox" />
              )}
              <ContactStatus icon={<ShieldCheck className="h-4 w-4" />} label="Secure delivery" />
              <ContactStatus icon={<Clock3 className="h-4 w-4" />} label="Async friendly" />
              {settings.data?.githubUrl ? (
                <ContactLink
                  href={settings.data.githubUrl}
                  icon={<Code2 className="h-4 w-4" />}
                  label="GitHub"
                  external
                />
              ) : null}
              {settings.data?.linkedinUrl ? (
                <ContactLink
                  href={settings.data.linkedinUrl}
                  icon={<Share2 className="h-4 w-4" />}
                  label="LinkedIn"
                  external
                />
              ) : null}
            </div>
            <div className="mt-8 border-t border-border pt-5">
              <p className="font-mono text-xs text-muted-foreground">STATUS</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {settings.data?.availabilityStatus ?? "Available for collaboration"}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function ContactStatus({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-foreground">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function ContactLink({
  href,
  icon,
  label,
  external = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="flex min-h-10 min-w-0 items-center gap-3 rounded-md px-3 text-sm text-foreground hover:bg-muted"
    >
      {icon}
      <span className="truncate">{label}</span>
    </a>
  );
}
