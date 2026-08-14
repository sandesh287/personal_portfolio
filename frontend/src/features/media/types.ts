export interface MediaAsset {
  id: string;
  filename: string;
  originalFilename: string;
  publicUrl: string | null;
  contentType: string;
  sizeBytes: number;
  altText: string | null;
  folder: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAssetCreate {
  file: File;
  altText?: string;
  folder?: string;
}

export interface MediaAssetUpdate {
  altText?: string;
  folder?: string;
}

export interface MediaAssetListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  contentType?: string;
  folder?: string;
  sort?: string;
  order?: "asc" | "desc";
}
