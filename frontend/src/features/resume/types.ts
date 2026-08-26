export interface ResumeVersion {
  id: string;
  mediaAssetId: string;
  title: string;
  version: string;
  isActive: boolean;
  downloadCount: number;
  notes: string | null;
  filename: string;
  publicUrl: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeUploadPayload {
  file: File;
  title: string;
  version: string;
  notes?: string;
  isActive: boolean;
}

export interface ResumeUpdatePayload {
  title?: string;
  version?: string;
  notes?: string | null;
}
