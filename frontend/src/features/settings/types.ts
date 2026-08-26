export interface PublicSettings {
  siteTitle: string;
  siteDescription: string;
  tagline: string;
  profileName: string;
  profileRole: string;
  contactEmail: string | null;
  githubUsername: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  availabilityStatus: string;
  timezone: string;
  locale: string;
  resumeEnabled: boolean;
  analyticsEnabled: boolean;
  seoDescription: string;
  searchEngineIndexing: boolean;
}

export type SettingsUpdatePayload = Partial<PublicSettings>;
