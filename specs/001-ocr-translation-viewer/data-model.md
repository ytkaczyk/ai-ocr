# Data Model: OCR Translation Comparison Viewer

**Date**: 2025-10-18 (Updated with IETF BCP 47 language codes)
**Feature**: 001-ocr-translation-viewer
**Purpose**: Define entities, relationships, and validation rules## Overview

This document defines the domain entities for the OCR Translation Comparison Viewer. All entities are derived from functional requirements in `spec.md` and support the three user stories.

---

## Entity Definitions

### 1. DocumentSet

**Description**: Represents a collection of files following the prescribed folder structure for a single document with its OCR and translation outputs.

**Source Requirements**: FR-007, FR-008, FR-009, FR-011

**Attributes**:

| Attribute | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `id` | `string` | ✅ | Unique, slug format | Identifier derived from filename (e.g., `contract-2024`) |
| `fileName` | `string` | ✅ | Valid filename without extension | Base name of PDF file (e.g., `contract-2024`) |
| `pdfPath` | `string` | ✅ | Absolute file path, exists, `.pdf` extension | Full path to PDF file |
| `folderPath` | `string` | ✅ | Absolute directory path, exists | Path to `<fileName>/` directory |
| `availableLanguages` | `LanguageVersion[]` | ✅ | Min length: 1 | List of language/version combinations available |
| `pageCount` | `number` | ✅ | Integer, >= 1, <= 10000 | Total pages in PDF (source of truth) |
| `pdfSizeBytes` | `number` | ✅ | Integer, > 0, <= MAX_PDF_SIZE_MB * 1024 * 1024 | File size in bytes |
| `createdAt` | `Date` | ✅ | ISO 8601 | When document set was first scanned |
| `lastModified` | `Date` | ✅ | ISO 8601, >= createdAt | Last modification time of any file in set |
| `hasValidStructure` | `boolean` | ✅ | - | Whether folder structure is complete and valid |
| `validationErrors` | `string[]` | ✅ | - | List of structure validation issues (empty if valid) |

**Relationships**:
- Has many `Page` entities (one per page number)
- Belongs to one `DataFolder`

**Business Rules**:
1. `id` must be URL-safe (used in API routes)
2. PDF file must exist and be readable
3. Folder path must contain at least one language subfolder
4. `pageCount` determined by PDF page count, not markdown file count
5. If `pdfSizeBytes` > configured max, document cannot be loaded (FR-020)

**State Transitions**:
- `DISCOVERED` → When scanned from data folder
- `VALIDATED` → After structure check passes
- `INVALID` → If validation errors found (still accessible with warnings)

---

### 2. LanguageVersion

**Description**: Represents a specific language output (raw or processed) for a document.

**Source Requirements**: FR-019, FR-021

**Attributes**:

| Attribute | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `languageCode` | `string` | ✅ | IETF BCP 47 language tag (e.g., `en-US`, `es-ES`, `fr-CA`), pattern: `^[a-z]{2}-[A-Z]{2}$` | Language and locale identifier |
| `isRaw` | `boolean` | ✅ | - | True if raw OCR output, false if processed |
| `folderName` | `string` | ✅ | `raw.<lang-COUNTRY>` or `<lang-COUNTRY>` | Folder name (e.g., `raw.en-US`, `en-US`) |
| `pageFiles` | `PageFile[]` | ✅ | Min length: 1 | Markdown files for each page |
| `isComplete` | `boolean` | ✅ | - | True if page count matches PDF |
| `missingPages` | `number[]` | ✅ | - | Page numbers with missing markdown files |

**Relationships**:
- Belongs to one `DocumentSet`
- Has many `PageFile` entities

**Business Rules**:
1. Processed version (`isRaw: false`) is preferred for display (FR-021)
2. Folder naming convention: `raw.<languageCode>` for raw, `<languageCode>` for processed (following IETF BCP 47 format)
3. Page numbering starts at 1 (not 0-indexed)

---

### 3. PageFile

**Description**: Represents a single markdown file for a specific page in a language version.

**Source Requirements**: FR-009, FR-010, FR-016

**Attributes**:

| Attribute | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `pageNumber` | `number` | ✅ | Integer, >= 1, <= DocumentSet.pageCount | Page number (1-indexed) |
| `filePath` | `string` | ✅ | Absolute path, exists, `.md` extension | Full path to markdown file |
| `fileName` | `string` | ✅ | Format: `<base>.[raw.]<lang-COUNTRY>_page_<N>.md` | File name (IETF BCP 47 format) |
| `content` | `string` | ✅ | Valid markdown | Raw markdown content |
| `hasImages` | `boolean` | ✅ | - | Whether markdown references images |
| `imageFiles` | `string[]` | ✅ | Relative paths within language folder | Paths to referenced images |
| `sizeBytes` | `number` | ✅ | Integer, >= 0 | File size in bytes |

**Relationships**:
- Belongs to one `LanguageVersion`

**Business Rules**:
1. File naming: `<fileName>.[raw.]<languageCode>_page_<pageNumber>.md` (following IETF BCP 47 format, e.g., `contract.en-US_page_1.md`)
2. Images resolved relative to markdown file location
3. Missing images do not block page display (show broken image indicator)

---

### 4. Page

**Description**: Represents a logical page view across all panes (PDF + language versions).

**Source Requirements**: FR-001, FR-002, FR-004

**Attributes**:

| Attribute | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `pageNumber` | `number` | ✅ | Integer, >= 1, <= DocumentSet.pageCount | Current page number |
| `pdfContent` | `PDFPageContent` | ✅ | - | Rendered PDF page data |
| `markdownContent` | `Map<LanguageVersion, PageFile>` | ✅ | - | Markdown content for each language |
| `isLoaded` | `boolean` | ✅ | - | Whether all content is fetched |
| `loadErrors` | `Map<string, Error>` | ✅ | - | Load errors by pane type |

**Relationships**:
- Belongs to one `DocumentSet`
- References multiple `PageFile` entities via language versions

**Business Rules**:
1. All panes synchronized to same `pageNumber` (FR-004)
2. PDF pane always visible, markdown panes depend on mode (FR-005)
3. Navigation blocked if `pageNumber < 1` or `pageNumber > pageCount` (FR-013)

**State Transitions**:
- `LOADING` → When navigation requested
- `LOADED` → When all pane content fetched
- `ERROR` → If any critical load failure (PDF)
- `PARTIAL` → If markdown missing but PDF loaded

---

### 5. Pane

**Description**: Represents a viewing area in the UI displaying content from one source.

**Source Requirements**: FR-001, FR-002, FR-005, FR-017

**Attributes**:

| Attribute | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `id` | `string` | ✅ | Unique within viewer | Pane identifier (`pdf`, `source`, `target`) |
| `type` | `PaneType` | ✅ | Enum: `PDF` \| `MARKDOWN` | Content type |
| `contentSource` | `ContentSource` | ✅ | - | Source configuration (PDF path or language version) |
| `isVisible` | `boolean` | ✅ | - | Whether pane is displayed |
| `widthPercent` | `number` | ✅ | Integer, >= 10, <= 90 | Width as percentage of viewport |
| `currentPage` | `number` | ✅ | Integer, >= 1 | Synchronized page number |

**Relationships**:
- Belongs to one `ViewerState`
- Displays content from one `Page`

**Business Rules**:
1. PDF pane always visible (FR-001)
2. In 2-pane mode: PDF + source language (FR-005)
3. In 3-pane mode: PDF + source + target language (FR-005)
4. Sum of all visible pane widths ≈ 100% (allowing for gutters)
5. Minimum width: 10% (prevents unusable panes)

---

### 6. ViewerState

**Description**: Global application state for the viewer UI.

**Source Requirements**: FR-003, FR-006, FR-012, FR-015

**Attributes**:

| Attribute | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `currentDocumentId` | `string \| null` | ✅ | Valid DocumentSet.id or null | Selected document |
| `currentPageNumber` | `number` | ✅ | Integer, >= 1 | Active page number |
| `paneMode` | `PaneMode` | ✅ | Enum: `TWO_PANE` \| `THREE_PANE` | Display mode |
| `panes` | `Pane[]` | ✅ | Length: 2 or 3 | Active panes |
| `isLoading` | `boolean` | ✅ | - | Global loading state |
| `navigationHistory` | `number[]` | ✅ | Max length: 50 | Recent page numbers |

**Business Rules**:
1. Mode cannot switch if target language unavailable (FR-006)
2. Page number persists when switching modes (FR-006)
3. Navigation history used for back/forward buttons (future)
4. State persisted in URL query params for bookmarking

**State Transitions**:
- `IDLE` → No document loaded
- `LOADING_DOCUMENT` → Document selection in progress
- `READY` → Document loaded, page displayed
- `NAVIGATING` → Page change in progress
- `ERROR` → Unrecoverable error

---

### 7. DataFolder

**Description**: Represents the configured server-side directory containing all document sets.

**Source Requirements**: FR-008, FR-011

**Attributes**:

| Attribute | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `path` | `string` | ✅ | Absolute directory path, exists, readable | Root data folder |
| `documents` | `DocumentSet[]` | ✅ | - | Discovered document sets |
| `lastScanned` | `Date` | ✅ | ISO 8601 | When folder was last scanned |
| `scanErrors` | `string[]` | ✅ | - | Errors during scan (e.g., permission issues) |

**Business Rules**:
1. Path configured via `DATA_FOLDER_PATH` in `.env` (FR-008)
2. Must have read permissions for all subdirectories
3. Scanned on server startup and periodically (or manual refresh)
4. Invalid document sets included in list with `hasValidStructure: false`

---

## Type Definitions (TypeScript)

```typescript
// Enums
enum PaneType {
  PDF = 'PDF',
  MARKDOWN = 'MARKDOWN'
}

enum PaneMode {
  TWO_PANE = 'TWO_PANE',
  THREE_PANE = 'THREE_PANE'
}

// Complex Types
type ContentSource = 
  | { type: 'pdf'; pdfPath: string }
  | { type: 'markdown'; languageVersion: LanguageVersion };

interface PDFPageContent {
  pageNumber: number;
  width: number;
  height: number;
  canvasData?: ImageData; // Rendered canvas
}
```

---

## Entity Relationship Diagram

```
DataFolder
  └─── 1:N ──> DocumentSet
                  ├─── 1:N ──> LanguageVersion
                  │              └─── 1:N ──> PageFile
                  └─── 1:N ──> Page

ViewerState
  ├─── 1:1 ──> DocumentSet (currentDocumentId)
  └─── 1:N ──> Pane
                  └─── 1:1 ──> Page (via currentPageNumber)
```

---

## Validation Rules Summary

| Entity | Validation Rule | Error Handling |
|--------|----------------|----------------|
| DocumentSet | PDF size <= MAX_PDF_SIZE_MB | Reject load, show error (FR-020) |
| DocumentSet | Folder structure valid | Allow load with warnings (FR-014) |
| LanguageVersion | Page count matches PDF | Show missing page indicators (FR-014) |
| PageFile | Markdown valid | Display error message in pane |
| Page | Page number in bounds | Disable navigation controls (FR-013) |
| Pane | Width >= 10% | Enforce minimum via UI constraints |
| ViewerState | Mode requires target language | Disable 3-pane toggle if unavailable |

---

## Next Steps

1. ✅ Data model complete
2. ⏭️ Generate API contracts in `/contracts/`
3. ⏭️ Define REST endpoints for CRUD operations
4. ⏭️ Create Zod schemas for runtime validation
