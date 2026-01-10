import { ErrorCode } from "./error.types";

// API Response Types
export interface ApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp?: string;
  path?: string;
  errorCode?: ErrorCode;
}

// Pagination Meta
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BaseEntity {
  createdAt: Date;
  updatedAt: Date;
  id: string;
}
