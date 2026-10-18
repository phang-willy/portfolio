export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: readonly T[];
  pagination: {
    readonly page: number;
    readonly size: number;
    readonly totalItems: number;
    readonly totalPages: number;
  };
}
