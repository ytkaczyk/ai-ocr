/**
 * API type definitions (placeholder).
 * Will be populated with types from OpenAPI schema in Phase 2.
 */

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};

export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};
