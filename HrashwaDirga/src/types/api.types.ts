/**
 * API Response Types
 * Defines standard response structures from backend
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}