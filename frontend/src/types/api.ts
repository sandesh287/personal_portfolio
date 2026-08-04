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
