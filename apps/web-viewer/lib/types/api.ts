/**
 * API type definitions for document endpoints
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

/**
 * Simplified DocumentSet for API responses
 * This is a subset of the full DocumentSet type used internally
 */
export interface ApiDocumentSet {
  id: string;
  fileName: string;
  pdfPath: string;
  availableLanguages: Array<{
    languageCode: string;
    isRaw: boolean;
    folderName: string;
  }>;
  pageCount: number;
  pdfSizeBytes?: number;
}

/**
 * Simplified LanguageVersion for API responses
 */
export interface ApiLanguageVersion {
  languageCode: string;
  isRaw: boolean;
  folderName: string;
  pageFiles: Array<{
    pageNumber: number;
    filePath: string;
  }>;
  pageCount: number;
}

/**
 * Response from GET /api/documents
 */
export interface GetDocumentsResponse {
  documents: ApiDocumentSet[];
}

/**
 * Response from GET /api/documents/[documentId]
 */
export interface GetDocumentByIdResponse {
  document: ApiDocumentSet;
  languageVersions: ApiLanguageVersion[];
}

/**
 * Response from POST /api/documents/[documentId]/validate
 */
export interface ValidateDocumentResponse {
  valid: boolean;
  documentId: string;
  languageVersions?: Array<{
    languageCode: string;
    isRaw: boolean;
    folderName: string;
    pageCount: number;
  }>;
  errors?: Array<{
    type: string;
    message: string;
    details?: Record<string, unknown>;
  }>;
}
