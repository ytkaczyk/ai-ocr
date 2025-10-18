# Feature Specification: OCR Translation Comparison Viewer

**Feature Branch**: `001-ocr-translation-viewer`  
**Created**: 2025-10-16  
**Status**: Draft  
**Input**: User description: "Build a web app that is going to help compare OCRing and translation for a document. The main page will have 2 or 3 panes, each pane showing a page of content. The user can scroll through the pages using a pager control and the system keeps the panes in sync so that they are all showing the same page. The content in the panes is either from pdf or md. In the 2 pane mode, the system shows the pages from the original pdf and the OCRed md file. In the 3 pane mode, the system shows the pages from the original pdf, the OCRed md file and the translated md file."

## Clarifications

**Terminology Note**: Throughout this document, `<language_code>` refers to IETF BCP 47 language tags (ISO 639-1 language + ISO 3166-1 country code, e.g., `en-US`, `es-ES`, `fr-CA`). The data folder path is configured via the `DATA_FOLDER_PATH` environment variable.

### Session 2025-10-16

- Q: Should file processing happen entirely in the browser (client-side) or on a backend server? → A: Server-side processing: Files are uploaded to a backend server that handles PDF rendering and markdown parsing, then streams results to the browser.
- Q: How should users select and upload their document files? → A: No upload - users select from pre-existing document sets in a configured server-side data folder. Folder structure: `<file_name>.pdf` + `<file_name>/[raw.]<language_code>/` containing per-page markdown files (`<file_name>.[raw.]<language_code>_page_<N>.md`) and images. Data folder path configured via .env file.
- Q: What is the maximum file size limit for documents? → A: Maximum PDF filesize is configurable via .env file with a default of 50MB
- Q: When both raw and processed versions exist for a language, which should be displayed by default? → A: Processed version: Always show `<language_code>` (processed) content by default when available
- Q: Which browsers must be supported? → A: Modern browsers: Chrome/Edge/Firefox/Safari (current + 1 previous major version)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compare Original PDF with OCR Output (Priority: P1)

Users need to verify OCR accuracy by viewing the original PDF page side-by-side with the OCR-generated markdown to identify discrepancies, formatting issues, or missed content.

**Why this priority**: This is the core value proposition—enabling users to validate OCR quality. Without this, the application has no purpose. This story alone delivers immediate value for OCR quality assurance.

**Independent Test**: Can be fully tested by loading a PDF document and its corresponding OCR markdown file, then navigating through pages to verify both panes display matching content and stay synchronized.

**Acceptance Scenarios**:

1. **[US1-AC1]** **Given** a user has opened a PDF and its OCR markdown file, **When** they view the main page, **Then** the left pane displays the PDF page and the right pane displays the corresponding markdown content
2. **[US1-AC2]** **Given** both panes are displaying page 5, **When** the user clicks "Next Page" on the pager control, **Then** both panes advance to page 6 simultaneously
3. **[US1-AC3]** **Given** the user is viewing page 10, **When** they use the pager to jump directly to page 3, **Then** both panes update to show page 3 content
4. **[US1-AC4]** **Given** a multi-page document is loaded, **When** the user scrolls through pages using arrow keys or pager buttons, **Then** both panes remain synchronized at all times
5. **[US1-AC5]** **Given** the user is on the last page, **When** they attempt to navigate forward, **Then** the system prevents navigation and indicates they are at the end

---

### User Story 2 - Switch Between 2-Pane and 3-Pane Modes (Priority: P2)

Users need to toggle between comparing just OCR output (2 panes) and comparing both OCR and translation outputs (3 panes) to assess both OCR accuracy and translation quality in a single workflow.

**Why this priority**: This extends the core comparison capability to include translation review. It builds on Story 1's foundation and is independently useful for users who need translation validation.

**Independent Test**: Can be tested by loading documents with original PDF, OCR markdown, and translated markdown, then toggling between 2-pane and 3-pane views to verify correct content display and synchronization in both modes.

**Acceptance Scenarios**:

1. **[US2-AC1]** **Given** a user has loaded documents including a translation file, **When** they select "3-Pane Mode" from a view toggle, **Then** the interface displays original PDF, OCR markdown, and translated markdown side-by-side
2. **[US2-AC2]** **Given** the user is in 3-pane mode on page 7, **When** they switch to 2-pane mode, **Then** the system shows only PDF and OCR markdown for page 7
3. **[US2-AC3]** **Given** the user is in 2-pane mode, **When** they load a document set that includes a translation file, **Then** the system offers the option to switch to 3-pane mode
4. **[US2-AC4]** **Given** the user switches between modes, **When** they navigate using the pager, **Then** all visible panes remain synchronized to the same page number

---

### User Story 3 - Load and Display Document Sets (Priority: P1)

Users need a simple way to select from available document sets in the configured data folder (PDF with associated markdown files in the prescribed folder structure) so they can begin comparison work.

**Why this priority**: This is a foundational capability that enables all other stories. Without document loading, no comparison can occur. Ranking this P1 because it's a prerequisite for the core workflow.

**Independent Test**: Can be tested by populating the data folder with document sets, presenting a selection UI listing available documents, and verifying that selected documents load correctly displaying the first page in the appropriate panes.

**Acceptance Scenarios**:

1. **[US3-AC1]** **Given** the data folder contains document sets, **When** a user opens the application, **Then** the system displays a list of available documents to choose from
2. **[US3-AC2]** **Given** a user selects a document from the list, **When** the system detects available language folders (e.g., raw.en-US, en-US, raw.es-ES, es-ES), **Then** it displays the PDF and source language markdown in 2-pane mode by default
3. **[US3-AC3]** **Given** a user has loaded a document with both source and target language folders, **When** they request 3-pane mode, **Then** the system displays PDF, source markdown, and target markdown side-by-side
4. **[US3-AC4]** **Given** a user attempts to load a document with mismatched page counts between PDF and markdown files, **When** the system detects the mismatch, **Then** it displays a warning but allows viewing with clear indicators where content is missing
5. **[US3-AC5]** **Given** a user selects a large document, **When** the loading completes, **Then** the system displays the first page within 3 seconds and enables pager navigation

---

### Edge Cases

- What happens when the PDF has 50 pages but the OCR markdown only represents 48 pages?
- How does the system handle large documents? System MUST support 200 pages per SC-004 without performance degradation, MAY degrade gracefully beyond 200 pages, and SHOULD reject documents with more than 500 pages.
- What happens if the user tries to load a PDF that cannot be rendered (corrupted file)? Display user-friendly error "Cannot render PDF (file may be corrupted)" with option to re-scan.
- What happens if a PDF exceeds the configured maximum file size limit (default 50MB)?
- How does the system behave when markdown files contain formatting that cannot be displayed in a pane (embedded images, complex tables)?
- What happens when the user resizes the browser window with multiple panes visible?
- How does the system handle documents with non-standard page sizes or orientations?
- What happens when the data folder is misconfigured or inaccessible in the .env file?
- How does the system handle incomplete folder structures (missing language folders or per-page markdown files)?
- What happens when image files referenced in markdown are missing from the expected directory?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the original PDF content in a dedicated pane with page-accurate rendering
- **FR-002**: System MUST display markdown content in dedicated panes with formatted text rendering
- **FR-003**: System MUST provide a pager control that allows users to navigate between pages using next/previous buttons and direct page number input
- **FR-004**: System MUST keep all visible panes synchronized to display the same page number at all times
- **FR-005**: System MUST support two display modes: 2-pane (PDF + OCR markdown) and 3-pane (PDF + OCR markdown + translated markdown)
- **FR-006**: System MUST allow users to switch between 2-pane and 3-pane modes without losing their current page position
- **FR-007**: System MUST scan the configured data folder and present users with a list of available document sets (PDFs with corresponding folder structures)
- **FR-008**: System MUST read the data folder path from a .env configuration file
- **FR-009**: System MUST load per-page markdown files following the naming convention `<file_name>.[raw.]<language_code>_page_<N>.md` synchronized with PDF page numbers
- **FR-010**: System MUST render images referenced in markdown files from the same directory as the markdown file for each pane. Display placeholder with alt text for missing images.
- **FR-011**: System MUST handle errors from all external dependencies with user-friendly messages and recovery options:
  - **FR-011a**: File system errors - Display specific messages for: missing data folder ("Data folder not found. Check DATA_FOLDER_PATH in .env"), permission denied ("Cannot access data folder. Check file permissions"), missing document folder ("Document folder missing or invalid structure")
  - **FR-011b**: PDF parsing errors - Display specific messages for: corrupted PDF ("Cannot render PDF (file may be corrupted)" with option to re-scan), unsupported PDF format ("PDF format not supported"), PDF rendering failure ("Failed to render PDF page N" with retry option)
  - **FR-011c**: Markdown rendering errors - Display specific messages for: missing markdown file ("Markdown file not found for page N"), malformed markdown ("Cannot display content due to formatting errors" - show raw text as fallback), invalid image paths (placeholder with alt text per FR-010)
  - **FR-011d**: Folder structure validation - Display specific messages for: invalid language code format (must match IETF BCP 47), missing language folders ("No language versions found for this document"), incomplete page sequence ("Missing pages detected: [list]")
  - All error messages MUST be user-friendly (avoid technical jargon), include recovery actions where applicable, and be accessible (ARIA roles, semantic HTML)
- **FR-012**: System MUST display the current page number and total page count in the pager control
- **FR-013**: System MUST prevent navigation beyond the available page range (no negative pages, no pages beyond document length)
- **FR-014**: System MUST handle documents with mismatched page counts gracefully, showing available content and indicating missing pages with a placeholder displaying "Page N unavailable" with a visual indicator (icon/color)
- **FR-015**: System MUST provide keyboard shortcuts for page navigation (Left/Right arrow keys for previous/next page, Page Up/Down for previous/next page; Up/Down arrows reserved for content scrolling)
- **FR-016**: System MUST render markdown content with basic formatting preserved (headings, paragraphs, lists, emphasis)
- **FR-017**: System MUST allow users to adjust the width of individual panes to focus on specific content. Pane width adjustable between 20% and 80% of viewport width, with changes persisted in URL query parameters.
- **FR-018**: System MUST display loading indicators for all asynchronous operations:
  - **FR-018a**: Document list scanning - Show skeleton loader or spinner while scanning data folder
  - **FR-018b**: Document loading - Show progress indicator when loading selected document (PDF + markdown files)
  - **FR-018c**: Page transitions - Show loading state in affected panes during page navigation (target: < 500ms per SC-002)
  - **FR-018d**: Pane rendering - Show placeholder/skeleton for individual panes while PDF or markdown content loads
  - **FR-018e**: Mode switching - Indicate loading state when switching between 2-pane and 3-pane modes
  - All loading indicators MUST be accessible (ARIA live regions) and non-blocking (user can cancel/navigate away)
- **FR-019**: System MUST support language-specific folder naming conventions (raw.<language_code> for raw OCR, <language_code> for processed content)
- **FR-020**: System MUST reject PDF files larger than a configurable maximum file size (defined in .env file, default: 50MB) and display an appropriate error message to the user
- **FR-021**: System MUST display processed content (`<language_code>` folders) by default when both raw and processed versions are available for a language
- **FR-022**: System MUST function correctly in Chrome, Edge, Firefox, and Safari (current and 1 previous major version)
- **FR-023**: System MUST handle zero-state scenarios with appropriate UI feedback:
  - **FR-023a**: Empty data folder - Display message "No documents found. Add PDF files and language folders to {DATA_FOLDER_PATH}" with instructions for folder structure
  - **FR-023b**: No documents found - Display message "No valid document sets found. Check folder structure matches: <file>.pdf + <file>/<language_code>/" with link to documentation
  - **FR-023c**: Data folder not configured - Display message "DATA_FOLDER_PATH not set in .env file" with setup instructions
  - All zero-state messages MUST include actionable next steps and be accessible (ARIA live regions, semantic HTML)
- **FR-024**: System MUST handle concurrent user interactions gracefully:
  - **FR-024a**: Rapid page navigation - Debounce navigation requests (max 1 per 100ms), cancel in-flight requests when new navigation initiated, display latest requested page when loaded
  - **FR-024b**: Mode switching during load - Queue mode switch requests until current document load completes, display loading indicator with "Switching to {mode}..." message
  - **FR-024c**: Pane width adjustment during navigation - Allow pane resize without blocking navigation, apply width changes immediately to UI, persist to URL after debounce (500ms)
  - **FR-024d**: Multiple rapid document selections - Cancel previous document load when new document selected, clear stale content immediately, show loading state for newly selected document
  - All concurrent interactions MUST maintain UI responsiveness (no blocking operations) and data consistency (no race conditions, no stale state)
- **FR-025**: System MUST provide responsive layout with device-appropriate UX:
  - **FR-025a**: Optimal desktop (≥ 1440px) - Side-by-side panes with adjustable widths (FR-017), all features fully accessible
  - **FR-025b**: Standard desktop (1024px - 1439px) - Side-by-side panes with reduced minimum width (30%), all features accessible
  - **FR-025c**: Tablet/small desktop (768px - 1023px) - Vertically stacked panes, display warning banner "For best experience, use viewport ≥ 1024px", pane width adjustment disabled
  - **FR-025d**: Mobile (< 768px) - Display message "This application requires viewport ≥ 768px. Please use a desktop or tablet device" with current viewport dimensions, disable viewer functionality
  - All responsive breakpoints MUST be tested across browsers (FR-022), maintain accessibility standards, preserve keyboard navigation

### Key Entities

*Note: This section provides a high-level summary. See [data-model.md](./data-model.md) for canonical entity definitions with full validation rules and relationships.*

- **Document Set**: Represents a collection of files following the prescribed folder structure: `<file_name>.pdf` plus `<file_name>/` directory containing language-specific subfolders (`[raw.]<language_code>/`) with per-page markdown files and images. Attributes: file name, available languages (source/target, raw/processed), page count, current page position, display mode (2-pane or 3-pane), data folder path
- **Page**: Represents a single page view within the document set, with content loaded from per-page markdown files (`<file_name>.[raw.]<language_code>_page_<N>.md`) and corresponding PDF page. Attributes: page number, content source (PDF/source language/target language), rendered content, associated images
- **Pane**: Represents a viewing area in the UI displaying content from one source (PDF, source language markdown, or target language markdown). Attributes: content type, language code, raw/processed flag, current page number, visibility state, width
- **Data Folder**: Represents the configured server-side directory containing all document sets. Attributes: folder path (from .env), available documents list

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can load a document set and begin comparing pages within 5 seconds of file selection (measured as time to Largest Contentful Paint - first interactive page, not full document scan)
- **SC-002**: Page navigation across all synchronized panes completes within 500 milliseconds for documents up to 100 pages
- **SC-003**: System maintains visual synchronization across all panes with zero drift (all panes always show the same page number)
- **SC-004**: Users can successfully review and compare documents up to 200 pages without performance degradation
- **SC-005**: 95% of users can switch between 2-pane and 3-pane modes without training or documentation
- **SC-006**: System correctly handles and displays markdown formatting for 90% of common markdown elements (headings, lists, emphasis, code blocks)

## Constitution Check (in-spec)

### User Story 1 Mapping:
- **Applicable Principles**: II. Test-First & Coverage Minimums, III. UX Consistency & Accessibility, V. Performance & Resource Efficiency
- **Evidence**: Integration tests for synchronized paging, unit tests for PDF/markdown rendering components, UX checklist for keyboard navigation and pane synchronization, performance benchmarks for page load times

### User Story 2 Mapping:
- **Applicable Principles**: II. Test-First & Coverage Minimums, III. UX Consistency & Accessibility
- **Evidence**: Integration tests for mode switching, unit tests for state preservation during mode changes, UX checklist for view toggle controls and mode indicators

### User Story 3 Mapping:
- **Applicable Principles**: II. Test-First & Coverage Minimums, III. UX Consistency & Accessibility, IV. Security & Data Protection
- **Evidence**: Integration tests for file loading flows, unit tests for file validation, security tests for file type validation and handling malformed files, UX checklist for file selection interface

### Functional Requirements Mapping:
- **FR-001 to FR-015**: Applicable Principles: I. Code Quality & Maintainability, II. Test-First & Coverage Minimums
- **Evidence**: Unit tests for each rendering and navigation requirement, contract tests for pane synchronization logic, inline documentation for public APIs

### Overall Feature:
- **Performance (FR-002, FR-015, SC-002, SC-004)**: V. Performance & Resource Efficiency with benchmarks for page switching and large document handling
- **Security (FR-008)**: IV. Security & Data Protection with input validation tests for file uploads
- **Accessibility (FR-012, FR-014)**: III. UX Consistency & Accessibility with keyboard navigation and responsive layout tests
