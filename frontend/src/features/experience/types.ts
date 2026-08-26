export interface TimelineEntity {
  id: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  achievements: string[];
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Experience extends TimelineEntity {
  company: string;
  role: string;
  employmentType: string | null;
  location: string | null;
  summary: string;
  technologies: string[];
  companyUrl: string | null;
}

export interface Education extends TimelineEntity {
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  location: string | null;
  description: string | null;
  institutionUrl: string | null;
}

export interface Certification {
  id: string;
  credentialMediaId: string | null;
  credentialMediaUrl: string | null;
  name: string;
  issuer: string;
  credentialId: string | null;
  credentialUrl: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CertificationMutationPayload {
  credentialMediaId?: string | null;
  name: string;
  issuer: string;
  credentialId?: string | null;
  credentialUrl?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  sortOrder?: number;
  published?: boolean;
}

export interface ExperienceMutationPayload {
  company: string;
  role: string;
  employmentType?: string | null;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  current?: boolean;
  summary: string;
  achievements?: string[];
  technologies?: string[];
  companyUrl?: string | null;
  sortOrder?: number;
  published?: boolean;
}

export interface EducationMutationPayload {
  institution: string;
  degree: string;
  fieldOfStudy?: string | null;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  current?: boolean;
  description?: string | null;
  achievements?: string[];
  institutionUrl?: string | null;
  sortOrder?: number;
  published?: boolean;
}
