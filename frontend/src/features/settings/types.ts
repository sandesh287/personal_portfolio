export interface PublicSettings {
  siteTitle: string;
  siteDescription: string;
  tagline: string;
  profileName: string;
  profileRole: string;
  profileImageUrl: string | null;
  profileImageMediaId: string | null;
  profileBiography: string;
  profilePhilosophy: string;
  profileCurrentFocus: string;
  profileLocation: string;
  contactEmail: string | null;
  githubUsername: string | null;
  githubUrl: string | null;
  githubProfileVisible: boolean;
  githubStatsVisible: boolean;
  githubRepositoriesVisible: boolean;
  githubInspectorVisible: boolean;
  githubActivityVisible: boolean;
  linkedinUrl: string | null;
  availabilityStatus: string;
  timezone: string;
  locale: string;
  resumeEnabled: boolean;
  analyticsEnabled: boolean;
  homeProfileVisible: boolean;
  homeQuickLinksVisible: boolean;
  homeProjectsVisible: boolean;
  homeNotesVisible: boolean;
  homeSkillsVisible: boolean;
  homeExperienceVisible: boolean;
  homeGithubVisible: boolean;
  profileCertificationsVisible: boolean;
  seoDescription: string;
  searchEngineIndexing: boolean;
}

export type SettingsUpdatePayload = Partial<PublicSettings>;
