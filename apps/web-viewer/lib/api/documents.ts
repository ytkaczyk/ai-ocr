import { DocumentSet } from '@/lib/types/entities';
import { ApiDocumentSet, ApiLanguageVersion } from '@/lib/types/api';

/**
 * API client for document operations
 * Implements client-side API calls to document endpoints
 * Implements FR-024b: AbortController for request cancellation
 */

export interface DocumentListResponse {
  documents: ApiDocumentSet[];
}

export interface DocumentDetailResponse {
  document: ApiDocumentSet;
  languageVersions: ApiLanguageVersion[];
}

export interface DocumentValidationResponse {
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

export interface ApiError {
  code: string;
  message: string;
  details: Record<string, unknown>;
}

/**
 * Options for API requests
 */
export interface ApiRequestOptions {
  signal?: AbortSignal;
}

/**
 * Convert API DocumentSet to full DocumentSet type
 */
function apiToDocumentSet(apiDoc: ApiDocumentSet): DocumentSet {
  return {
    id: apiDoc.id,
    fileName: apiDoc.fileName,
    pdfPath: apiDoc.pdfPath,
    folderPath: apiDoc.id, // Folder name matches document ID
    availableLanguages: apiDoc.availableLanguages.map((lang) => ({
      languageCode: lang.languageCode,
      isRaw: lang.isRaw,
      folderName: lang.folderName,
      pageFiles: [],
      isComplete: false,
      missingPages: [],
    })),
    pageCount: apiDoc.pageCount,
    pdfSizeBytes: apiDoc.pdfSizeBytes || 0,
    createdAt: new Date(),
    lastModified: new Date(),
    hasValidStructure: true,
    validationErrors: [],
  };
}

/**
 * Fetch all available documents from the data folder
 * @param options - Optional request options including AbortSignal
 * @returns List of document sets
 * @throws Error if the request fails
 */
export async function fetchDocuments(
  options?: ApiRequestOptions
): Promise<{ documents: DocumentSet[] }> {
  const response = await fetch('/api/documents', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: options?.signal,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch documents');
  }

  const data: DocumentListResponse = await response.json();
  
  return {
    documents: data.documents.map(apiToDocumentSet),
  };
}

/**
 * Fetch detailed information about a specific document
 * @param documentId - The document ID
 * @param options - Optional request options including AbortSignal
 * @returns Document details with language versions
 * @throws Error if the request fails
 */
export async function fetchDocumentById(
  documentId: string,
  options?: ApiRequestOptions
): Promise<DocumentDetailResponse> {
  const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: options?.signal,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch document');
  }

  return response.json();
}

/**
 * Validate a document's structure and completeness
 * @param documentId - The document ID
 * @param options - Optional request options including AbortSignal
 * @returns Validation result with any errors found
 * @throws Error if the request fails
 */
export async function validateDocument(
  documentId: string,
  options?: ApiRequestOptions
): Promise<DocumentValidationResponse> {
  const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: options?.signal,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to validate document');
  }

  return response.json();
}

/**
 * Fetch markdown page
 * @param documentId - The document ID
 * @param pageNumber - The page number
 * @param languageCode - The language code
 * @param options - Optional request options including AbortSignal
 * @returns Markdown content
 * @throws Error if the request fails
 */
export async function fetchMarkdownPage(
  documentId: string,
  pageNumber: number,
  languageCode: string,
  options?: ApiRequestOptions
): Promise<string> {
  const response = await fetch(
    `/api/documents/${encodeURIComponent(documentId)}/pages/${pageNumber}/markdown?lang=${encodeURIComponent(languageCode)}`,
    {
      method: 'GET',
      signal: options?.signal,
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch markdown page');
  }

  return response.text();
}
