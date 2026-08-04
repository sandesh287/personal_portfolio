export interface ApiErrorDetail {
  code: string;
  message: string;
  field: string | null;
}

export interface ApiResponse<TData> {
  success: boolean;
  data: TData;
  message: string | null;
  errors: ApiErrorDetail[];
}

export interface PaginatedResponse<TData> {
  items: TData[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedPayload<TData> {
  items: TData[];
  meta: PaginationMeta;
}
