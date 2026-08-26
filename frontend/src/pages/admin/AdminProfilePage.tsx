import { zodResolver } from "@hookform/resolvers/zod";
import { Award, Edit3, ImageIcon, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState } from "@/components/common/EmptyState";
import { FormActions } from "@/components/form/FormActions";
import { FormField, TextInput } from "@/components/form/FormField";
import { Textarea } from "@/components/form/Textarea";
import { MediaImagePickerModal } from "@/components/media/MediaImagePickerModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useCertifications,
  useCreateCertification,
  useDeleteCertification,
  useUpdateCertification,
} from "@/features/experience";
import type { Certification, CertificationMutationPayload } from "@/features/experience";
import type { MediaAsset } from "@/features/media";
import { useAdminSettings, useUpdateSettings } from "@/features/settings";
import { getResponsiveImageAttributes } from "@/utils/cloudinaryImage";
import { getErrorMessage } from "@/utils/errors";

const profileSchema = z.object({
  profileName: z.string().min(2).max(160),
  profileRole: z.string().min(2).max(160),
  profileBiography: z.string().min(20).max(4000),
  profilePhilosophy: z.string().min(10).max(2000),
  profileCurrentFocus: z.string().min(2).max(500),
  profileLocation: z.string().min(2).max(180),
  profileCertificationsVisible: z.boolean(),
});

const certificationSchema = z.object({
  name: z.string().min(2).max(180),
  issuer: z.string().min(2).max(180),
  credentialId: z.string().max(180),
  credentialUrl: z.union([z.literal(""), z.string().url()]),
  issuedAt: z.string(),
  expiresAt: z.string(),
  sortOrder: z.coerce.number().int().min(0),
  published: z.boolean(),
});

type ProfileValues = z.infer<typeof profileSchema>;
type CertificationInput = z.input<typeof certificationSchema>;
type CertificationValues = z.output<typeof certificationSchema>;

export function AdminProfilePage() {
  const settings = useAdminSettings();
  const updateSettings = useUpdateSettings();
  const certifications = useCertifications(undefined, true);
  const remove = useDeleteCertification();
  const [profileImage, setProfileImage] = useState<{ id: string; url: string } | null>(null);
  const [isProfilePickerOpen, setIsProfilePickerOpen] = useState(false);
  const [editing, setEditing] = useState<Certification | null>(null);
  const [isCertificationOpen, setIsCertificationOpen] = useState(false);
  const form = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (!settings.data) return;
    form.reset(settings.data);
    if (settings.data.profileImageMediaId && settings.data.profileImageUrl) {
      setProfileImage({
        id: settings.data.profileImageMediaId,
        url: settings.data.profileImageUrl,
      });
    } else setProfileImage(null);
  }, [form, settings.data]);

  async function saveProfile(values: ProfileValues) {
    try {
      await updateSettings.mutateAsync({
        ...values,
        profileImageMediaId: profileImage?.id ?? null,
        profileImageUrl: profileImage?.url ?? null,
      });
      toast.success("Developer profile saved.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Profile could not be saved."));
    }
  }

  async function deleteCertification(item: Certification) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try {
      await remove.mutateAsync(item.id);
      toast.success("Certification deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (settings.isLoading) return <Skeleton className="h-[36rem]" />;
  if (settings.isError)
    return (
      <EmptyState
        title="Profile settings could not be loaded"
        description={getErrorMessage(settings.error)}
      />
    );

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-medium uppercase text-muted-foreground">Developer identity</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Profile management</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage the public profile, portrait, biography, and professional credentials.
        </p>
      </header>

      <form
        onSubmit={form.handleSubmit(saveProfile)}
        className="overflow-hidden rounded-md border border-border bg-background"
      >
        <header className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Profile workspace</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Changes appear on the homepage and Developer Profile.
            </p>
          </div>
          <Button
            type="submit"
            isLoading={updateSettings.isPending}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save profile
          </Button>
        </header>
        <div className="grid lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="border-b border-border bg-muted/30 p-4 lg:border-b-0 lg:border-r">
            <div className="aspect-square overflow-hidden rounded-md border border-border bg-muted">
              {profileImage ? (
                <img
                  {...getResponsiveImageAttributes(profileImage.url, {
                    widths: [320, 640],
                    sizes: "256px",
                  })}
                  alt="Selected profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="secondary"
              className="mt-3 w-full"
              leftIcon={<ImageIcon className="h-4 w-4" />}
              onClick={() => setIsProfilePickerOpen(true)}
            >
              Choose profile picture
            </Button>
            {profileImage ? (
              <Button
                type="button"
                variant="ghost"
                className="mt-2 w-full"
                onClick={() => setProfileImage(null)}
              >
                Remove picture
              </Button>
            ) : null}
          </aside>
          <div className="grid gap-4 p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Profile name" error={form.formState.errors.profileName?.message}>
                <TextInput {...form.register("profileName")} />
              </Field>
              <Field label="Primary role" error={form.formState.errors.profileRole?.message}>
                <TextInput {...form.register("profileRole")} />
              </Field>
            </div>
            <Field label="Biography" error={form.formState.errors.profileBiography?.message}>
              <Textarea rows={6} {...form.register("profileBiography")} />
            </Field>
            <Field
              label="Development philosophy"
              error={form.formState.errors.profilePhilosophy?.message}
            >
              <Textarea rows={4} {...form.register("profilePhilosophy")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Current focus"
                error={form.formState.errors.profileCurrentFocus?.message}
              >
                <TextInput {...form.register("profileCurrentFocus")} />
              </Field>
              <Field label="Location" error={form.formState.errors.profileLocation?.message}>
                <TextInput {...form.register("profileLocation")} />
              </Field>
            </div>
            <label className="flex items-center justify-between gap-4 rounded-md border border-border p-4">
              <span>
                <span className="block text-sm font-medium text-foreground">
                  Show certifications
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Display published credentials on the public profile.
                </span>
              </span>
              <input
                type="checkbox"
                className="h-5 w-5 accent-primary"
                {...form.register("profileCertificationsVisible")}
              />
            </label>
          </div>
        </div>
      </form>

      <section className="overflow-hidden rounded-md border border-border bg-background">
        <header className="flex items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Certifications</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Credentials, course completions, and professional certificates.
            </p>
          </div>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditing(null);
              setIsCertificationOpen(true);
            }}
          >
            New certification
          </Button>
        </header>
        <div className="p-4">
          {certifications.isLoading ? <Skeleton className="h-40" /> : null}
          {!certifications.isLoading && !certifications.data?.length ? (
            <EmptyState
              title="No certifications yet"
              description="Create your first professional credential."
            />
          ) : null}
          <div className="grid gap-3 lg:grid-cols-2">
            {certifications.data?.map((item) => (
              <article
                key={item.id}
                className="flex items-start gap-3 rounded-md border border-border bg-surface p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Award className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words text-sm font-semibold text-foreground">
                      {item.name}
                    </h3>
                    <span
                      className={`rounded-sm px-2 py-0.5 text-xs ${item.published ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}
                    >
                      {item.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.issuer}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    leftIcon={<Edit3 className="h-4 w-4" />}
                    onClick={() => {
                      setEditing(item);
                      setIsCertificationOpen(true);
                    }}
                  >
                    Edit certification
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    leftIcon={<Trash2 className="h-4 w-4 text-destructive" />}
                    onClick={() => void deleteCertification(item)}
                  >
                    Delete certification
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <MediaImagePickerModal
        isOpen={isProfilePickerOpen}
        selectedId={profileImage?.id ?? null}
        title="Choose profile picture"
        description="Select a portrait from the Media Library."
        clearLabel="Remove picture"
        onClose={() => setIsProfilePickerOpen(false)}
        onClear={() => {
          setProfileImage(null);
          setIsProfilePickerOpen(false);
        }}
        onSelect={(media) => {
          if (media.publicUrl) setProfileImage({ id: media.id, url: media.publicUrl });
          setIsProfilePickerOpen(false);
        }}
      />
      <CertificationModal
        isOpen={isCertificationOpen}
        certification={editing}
        onClose={() => setIsCertificationOpen(false)}
      />
    </div>
  );
}

function CertificationModal({
  isOpen,
  certification,
  onClose,
}: {
  isOpen: boolean;
  certification: Certification | null;
  onClose: () => void;
}) {
  const create = useCreateCertification();
  const update = useUpdateCertification(certification?.id ?? "");
  const [media, setMedia] = useState<{ id: string; url: string } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const form = useForm<CertificationInput, unknown, CertificationValues>({
    resolver: zodResolver(certificationSchema),
  });
  useEffect(() => {
    form.reset({
      name: certification?.name ?? "",
      issuer: certification?.issuer ?? "",
      credentialId: certification?.credentialId ?? "",
      credentialUrl: certification?.credentialUrl ?? "",
      issuedAt: certification?.issuedAt ?? "",
      expiresAt: certification?.expiresAt ?? "",
      sortOrder: certification?.sortOrder ?? 0,
      published: certification?.published ?? false,
    });
    setMedia(
      certification?.credentialMediaId && certification.credentialMediaUrl
        ? { id: certification.credentialMediaId, url: certification.credentialMediaUrl }
        : null,
    );
  }, [certification, form, isOpen]);
  async function submit(values: CertificationValues) {
    const payload: CertificationMutationPayload = {
      ...values,
      credentialMediaId: media?.id ?? null,
      credentialId: values.credentialId || null,
      credentialUrl: values.credentialUrl || null,
      issuedAt: values.issuedAt || null,
      expiresAt: values.expiresAt || null,
    };
    try {
      if (certification) await update.mutateAsync(payload);
      else await create.mutateAsync(payload);
      toast.success(`Certification ${certification ? "updated" : "created"}.`);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={certification ? "Edit certification" : "New certification"}
        description="Manage credential details and public visibility."
        className="max-w-2xl"
      >
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Certification name" error={form.formState.errors.name?.message}>
              <TextInput {...form.register("name")} />
            </Field>
            <Field label="Issuer" error={form.formState.errors.issuer?.message}>
              <TextInput {...form.register("issuer")} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Credential ID">
              <TextInput {...form.register("credentialId")} />
            </Field>
            <Field label="Credential URL" error={form.formState.errors.credentialUrl?.message}>
              <TextInput type="url" {...form.register("credentialUrl")} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Issued at">
              <TextInput type="date" {...form.register("issuedAt")} />
            </Field>
            <Field label="Expires at">
              <TextInput type="date" {...form.register("expiresAt")} />
            </Field>
          </div>
          <div className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              {media ? (
                <img
                  src={media.url}
                  alt="Credential preview"
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <Award className="h-8 w-8 text-muted-foreground" />
              )}
              <p className="text-xs text-muted-foreground">
                Optional credential image from Media Library
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
              Choose image
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sort order">
              <TextInput type="number" {...form.register("sortOrder")} />
            </Field>
            <label className="flex items-center gap-3 self-end rounded-md border border-border p-3 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-5 w-5 accent-primary"
                {...form.register("published")}
              />{" "}
              Published
            </label>
          </div>
          <FormActions>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={create.isPending || update.isPending}>
              {certification ? "Save certification" : "Create certification"}
            </Button>
          </FormActions>
        </form>
      </Modal>
      <MediaImagePickerModal
        isOpen={pickerOpen}
        selectedId={media?.id ?? null}
        title="Choose credential image"
        description="Select an uploaded certificate or badge image."
        clearLabel="Remove image"
        onClose={() => setPickerOpen(false)}
        onClear={() => {
          setMedia(null);
          setPickerOpen(false);
        }}
        onSelect={(asset: MediaAsset) => {
          if (asset.publicUrl) setMedia({ id: asset.id, url: asset.publicUrl });
          setPickerOpen(false);
        }}
      />
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <FormField label={label} error={error}>
      {children}
    </FormField>
  );
}
