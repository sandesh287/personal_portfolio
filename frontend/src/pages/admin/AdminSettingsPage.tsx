import { zodResolver } from "@hookform/resolvers/zod";
import { Code2, Eye, Globe2, RefreshCw, Save, Search, Share2, UserRound } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useForm, type UseFormReturn, type UseFormRegisterReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState } from "@/components/common/EmptyState";
import { FormField, TextInput } from "@/components/form/FormField";
import { Textarea } from "@/components/form/Textarea";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminSettings, useUpdateSettings } from "@/features/settings";
import { useSyncGitHub } from "@/features/github";
import { cn } from "@/utils/cn";
import { getErrorMessage } from "@/utils/errors";

const optionalEmail = z.union([z.literal(""), z.string().email("Enter a valid email address.")]);
const optionalUrl = z.union([z.literal(""), z.string().url("Enter a complete URL.")]);
const settingsSchema = z.object({
  siteTitle: z.string().min(2).max(160),
  siteDescription: z.string().min(2).max(500),
  tagline: z.string().min(2).max(500),
  profileName: z.string().min(2).max(160),
  profileRole: z.string().min(2).max(160),
  contactEmail: optionalEmail,
  githubUsername: z.string().max(80),
  githubUrl: optionalUrl,
  githubProfileVisible: z.boolean(),
  githubStatsVisible: z.boolean(),
  githubRepositoriesVisible: z.boolean(),
  githubInspectorVisible: z.boolean(),
  githubActivityVisible: z.boolean(),
  linkedinUrl: optionalUrl,
  availabilityStatus: z.string().min(2).max(160),
  timezone: z.string().min(2).max(80),
  locale: z.string().min(2).max(20),
  resumeEnabled: z.boolean(),
  analyticsEnabled: z.boolean(),
  seoDescription: z.string().min(20).max(320),
  searchEngineIndexing: z.boolean(),
});

type SettingsValues = z.infer<typeof settingsSchema>;
type SettingsForm = UseFormReturn<SettingsValues>;
type SettingsTab = "general" | "profile" | "social" | "features" | "seo";

const tabs: Record<SettingsTab, { label: string; description: string; icon: ReactNode }> = {
  general: {
    label: "General",
    description: "Configure core site metadata and localization.",
    icon: <Globe2 className="h-4 w-4" />,
  },
  profile: {
    label: "Profile",
    description: "Manage your public identity and availability.",
    icon: <UserRound className="h-4 w-4" />,
  },
  social: {
    label: "Social Links",
    description: "Connect public professional profiles.",
    icon: <Share2 className="h-4 w-4" />,
  },
  features: {
    label: "Features",
    description: "Control optional workspace capabilities.",
    icon: <Code2 className="h-4 w-4" />,
  },
  seo: {
    label: "SEO",
    description: "Control search metadata and visibility.",
    icon: <Search className="h-4 w-4" />,
  },
};

export function AdminSettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("general");
  const query = useAdminSettings();
  const update = useUpdateSettings();
  const form = useForm<SettingsValues>({ resolver: zodResolver(settingsSchema) });

  useEffect(() => {
    if (!query.data) return;
    form.reset({
      ...query.data,
      contactEmail: query.data.contactEmail ?? "",
      githubUsername: query.data.githubUsername ?? "",
      githubUrl: query.data.githubUrl ?? "",
      linkedinUrl: query.data.linkedinUrl ?? "",
    });
  }, [form, query.data]);

  async function submit(values: SettingsValues) {
    try {
      await update.mutateAsync({
        ...values,
        contactEmail: values.contactEmail || null,
        githubUsername: values.githubUsername || null,
        githubUrl: values.githubUrl || null,
        linkedinUrl: values.linkedinUrl || null,
      });
      toast.success("Workspace settings saved.");
      form.reset(values);
    } catch (error) {
      toast.error(getErrorMessage(error, "Settings could not be saved."));
    }
  }

  if (query.isLoading) return <SettingsSkeleton />;
  if (query.isError) {
    return (
      <EmptyState title="Settings could not be loaded" description={getErrorMessage(query.error)} />
    );
  }

  const preview = form.watch();
  return (
    <form
      className="overflow-hidden rounded-md border border-border bg-background"
      onSubmit={form.handleSubmit(submit)}
    >
      <header className="flex flex-col gap-4 border-b border-border p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">System preferences</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            {tabs[tab].label} settings
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{tabs[tab].description}</p>
        </div>
        <Button type="submit" isLoading={update.isPending} leftIcon={<Save className="h-4 w-4" />}>
          Save changes
        </Button>
      </header>

      <div className="grid min-h-[38rem] xl:grid-cols-[13rem_minmax(0,1fr)_18rem]">
        <nav
          className="flex gap-1 overflow-x-auto border-b border-border bg-muted/40 p-2 xl:flex-col xl:border-b-0 xl:border-r xl:p-3"
          aria-label="Settings sections"
        >
          {(Object.keys(tabs) as SettingsTab[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                "flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium",
                tab === item
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tabs[item].icon}
              {tabs[item].label}
            </button>
          ))}
        </nav>

        <main className="min-w-0 p-4 sm:p-6">
          <div className="mx-auto max-w-2xl space-y-5">
            {tab === "general" ? <GeneralFields form={form} /> : null}
            {tab === "profile" ? <ProfileFields form={form} /> : null}
            {tab === "social" ? <SocialFields form={form} /> : null}
            {tab === "features" ? <FeatureFields form={form} /> : null}
            {tab === "seo" ? <SeoFields form={form} /> : null}
          </div>
        </main>

        <aside className="border-t border-border bg-muted/30 p-4 xl:border-l xl:border-t-0">
          <p className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
            <Eye className="h-4 w-4" /> Live preview
          </p>
          <div className="mt-4 overflow-hidden rounded-md border border-border bg-background">
            <div
              className="flex h-8 items-center gap-1.5 border-b border-border bg-muted px-3"
              aria-hidden="true"
            >
              <span className="h-2 w-2 rounded-full bg-destructive" />
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <div className="p-4">
              <p className="break-words text-sm font-semibold text-primary">{preview.siteTitle}</p>
              <h2 className="mt-8 break-words text-lg font-semibold text-foreground">
                {preview.profileName}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{preview.profileRole}</p>
              <p className="mt-4 break-words text-xs leading-5 text-muted-foreground">
                {preview.tagline}
              </p>
              <p className="mt-6 flex items-center gap-2 text-xs text-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {preview.availabilityStatus}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}

function GeneralFields({ form }: { form: SettingsForm }) {
  return (
    <>
      <Field form={form} name="siteTitle" label="Site title" />
      <TextAreaField form={form} name="siteDescription" label="Site description" />
      <TextAreaField form={form} name="tagline" label="Tagline" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field form={form} name="timezone" label="Timezone" placeholder="Asia/Kathmandu" />
        <Field form={form} name="locale" label="Locale" placeholder="en" />
      </div>
    </>
  );
}

function ProfileFields({ form }: { form: SettingsForm }) {
  return (
    <>
      <Field form={form} name="profileName" label="Profile name" />
      <Field form={form} name="profileRole" label="Primary role" />
      <Field form={form} name="contactEmail" label="Contact email" type="email" />
      <Field form={form} name="availabilityStatus" label="Availability status" />
    </>
  );
}

function SocialFields({ form }: { form: SettingsForm }) {
  const sync = useSyncGitHub();

  async function refreshGitHub() {
    try {
      await sync.mutateAsync();
      toast.success("GitHub cache refreshed.");
    } catch (error) {
      toast.error(getErrorMessage(error, "GitHub cache could not be refreshed."));
    }
  }

  return (
    <>
      <Field form={form} name="githubUsername" label="GitHub username" />
      <Field
        form={form}
        name="githubUrl"
        label="GitHub profile URL"
        type="url"
        placeholder="https://github.com/..."
      />
      <div className="divide-y divide-border rounded-md border border-border">
        <ToggleField
          label="Profile header"
          description="Show your avatar, biography, location, and GitHub profile link."
          registration={form.register("githubProfileVisible")}
        />
        <ToggleField
          label="Repository statistics"
          description="Show repository, star, fork, and recent commit totals."
          registration={form.register("githubStatsVisible")}
        />
        <ToggleField
          label="Repository explorer"
          description="Show searchable and sortable public repositories."
          registration={form.register("githubRepositoriesVisible")}
        />
        <ToggleField
          label="Repository inspector"
          description="Show metadata for the selected repository beside the explorer."
          registration={form.register("githubInspectorVisible")}
        />
        <ToggleField
          label="Recent activity"
          description="Show the latest public GitHub events."
          registration={form.register("githubActivityVisible")}
        />
      </div>
      <Field
        form={form}
        name="linkedinUrl"
        label="LinkedIn profile URL"
        type="url"
        placeholder="https://linkedin.com/in/..."
      />
      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-muted-foreground">
          Save username changes before refreshing the cached profile, repositories, and activity.
        </p>
        <Button
          type="button"
          variant="secondary"
          isLoading={sync.isPending}
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={() => void refreshGitHub()}
        >
          Refresh GitHub
        </Button>
      </div>
    </>
  );
}

function FeatureFields({ form }: { form: SettingsForm }) {
  return (
    <div className="divide-y divide-border rounded-md border border-border">
      <ToggleField
        label="Public resume"
        description="Show the Resume workspace and active document."
        registration={form.register("resumeEnabled")}
      />
      <ToggleField
        label="Analytics"
        description="Enable analytics when its integration is configured."
        registration={form.register("analyticsEnabled")}
      />
    </div>
  );
}

function SeoFields({ form }: { form: SettingsForm }) {
  return (
    <>
      <TextAreaField
        form={form}
        name="seoDescription"
        label="SEO description"
        description={`${form.watch("seoDescription")?.length ?? 0} / 320 characters`}
      />
      <div className="rounded-md border border-border">
        <ToggleField
          label="Search engine indexing"
          description="Allow search engines to index the public portfolio."
          registration={form.register("searchEngineIndexing")}
        />
      </div>
    </>
  );
}

type TextFieldName =
  | "siteTitle"
  | "siteDescription"
  | "tagline"
  | "profileName"
  | "profileRole"
  | "contactEmail"
  | "githubUsername"
  | "githubUrl"
  | "linkedinUrl"
  | "availabilityStatus"
  | "timezone"
  | "locale"
  | "seoDescription";

function Field({
  form,
  name,
  label,
  type = "text",
  placeholder,
}: {
  form: SettingsForm;
  name: TextFieldName;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <FormField label={label} error={form.formState.errors[name]?.message}>
      <TextInput {...form.register(name)} type={type} placeholder={placeholder} />
    </FormField>
  );
}

function TextAreaField({
  form,
  name,
  label,
  description,
}: {
  form: SettingsForm;
  name: TextFieldName;
  label: string;
  description?: string;
}) {
  return (
    <FormField label={label} error={form.formState.errors[name]?.message} description={description}>
      <Textarea {...form.register(name)} rows={5} />
    </FormField>
  );
}

function ToggleField({
  label,
  description,
  registration,
}: {
  label: string;
  description: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <label className="flex min-h-20 items-center justify-between gap-4 p-4">
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
      <input type="checkbox" className="h-5 w-5 shrink-0 accent-primary" {...registration} />
    </label>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 lg:grid-cols-[13rem_1fr]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
