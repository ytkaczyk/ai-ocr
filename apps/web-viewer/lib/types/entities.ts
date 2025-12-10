/**
 * TypeScript type definitions for domain entities.
 * See specs/001-ocr-translation-viewer/data-model.md for canonical definitions.
 */

// IETF BCP 47 language tag format (e.g., en-US, es-ES, fr-CA)
export type LanguageCode = string;

// Document Set - Collection of files following prescribed folder structure
export interface DocumentSet {
  id: string; // URL-safe identifier (slug format)
  fileName: string; // Base name without extension
  pdfPath: string; // Absolute path to PDF file
  folderPath: string; // Absolute path to document folder
  availableLanguages: LanguageVersion[]; // Language/version combinations
  pageCount: number; // Total pages in PDF (source of truth)
  pdfSizeBytes: number; // File size in bytes
  createdAt: Date; // When document set was first scanned
  lastModified: Date; // Last modification time
  hasValidStructure: boolean; // Structure validation result
  validationErrors: string[]; // List of validation issues
}

// Language Version - Specific language output (raw or processed)
export interface LanguageVersion {
  languageCode: LanguageCode; // IETF BCP 47 tag
  isRaw: boolean; // True if raw OCR, false if processed
  folderName: string; // Folder name (e.g., raw.en-US or en-US)
  pageFiles: PageFile[]; // Markdown files for each page
  isComplete: boolean; // True if page count matches PDF
  missingPages: number[]; // Page numbers with missing markdown files
}

// Page File - Individual markdown file for a page
export interface PageFile {
  pageNumber: number; // Page number (1-indexed)
  filePath: string; // Absolute path to markdown file
  fileName: string; // File name following convention
  exists: boolean; // Whether file exists on disk
  sizeBytes: number; // File size in bytes
}

// Page - Single page view with content
export interface Page {
  pageNumber: number; // Current page number (1-indexed)
  pdfContent?: ArrayBuffer; // PDF page content
  markdownContent?: string; // Markdown content
  images: ImageReference[]; // Associated images
}

// Image Reference - Image referenced in markdown
export interface ImageReference {
  path: string; // Relative path from markdown file
  altText: string; // Alt text for accessibility
  exists: boolean; // Whether image file exists
}

// Pane - Viewing area displaying content from one source
export interface Pane {
  id: string; // Unique pane identifier
  contentType: 'pdf' | 'markdown'; // Content type
  languageCode?: LanguageCode; // For markdown panes
  isRaw?: boolean; // For markdown panes
  currentPage: number; // Current page number
  visible: boolean; // Visibility state
  widthPercent: number; // Width as percentage (20-80)
}

// Viewer State - Overall viewer state
export interface ViewerState {
  currentDocumentId: string | null; // Selected document ID
  currentPage: number; // Current page across all panes
  paneMode: 'TWO_PANE' | 'THREE_PANE'; // Display mode
  panes: Pane[]; // Active panes
  isLoading: boolean; // Loading state
  error: string | null; // Error message if any
}

// Data Folder - Server-side directory configuration
export interface DataFolder {
  path: string; // Absolute path from .env
  documents: DocumentSet[]; // Available documents
  lastScanned: Date; // Last scan timestamp
  isAccessible: boolean; // Whether folder is accessible
}
