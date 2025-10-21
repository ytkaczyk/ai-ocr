import { DocumentSet } from '@/lib/types/entities';
import { ApiDocumentSet, ApiLanguageVersion } from '@/lib/types/api';

/**
 * API client for document operations
 * Implements client-side API calls to document endpoints
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
 * @returns List of document sets
 * @throws Error if the request fails
 */
export async function fetchDocuments(): Promise<{ documents: DocumentSet[] }> {
  const response = await fetch('/api/documents', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
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
 * @returns Document details with language versions
 * @throws Error if the request fails
 */
export async function fetchDocumentById(documentId: string): Promise<DocumentDetailResponse> {
  const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
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
 * @returns Validation result with any errors found
 * @throws Error if the request fails
 */
export async function validateDocument(documentId: string): Promise<DocumentValidationResponse> {
  const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to validate document');
  }

  return response.json();
}
