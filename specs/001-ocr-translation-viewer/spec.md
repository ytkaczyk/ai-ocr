# Feature Specification: OCR Translation Comparison Viewer

**Feature Branch**: `001-ocr-translation-viewer`  
**Created**: 2025-10-16  
**Status**: Draft  
**Input**: User description: "Build a web app that is going to help compare OCRing and translation for a document. The main page will have 2 or 3 panes, each pane showing a page of content. The user can scroll through the pages using a pager control and the system keeps the panes in sync so that they are all showing the same page. The content in the panes is either from pdf or md. In the 2 pane mode, the system shows the pages from the original pdf and the OCRed md file. In the 3 pane mode, the system shows the pages from the original pdf, the OCRed md file and the translated md file."

## Clarifications

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

1. **Given** a user has opened a PDF and its OCR markdown file, **When** they view the main page, **Then** the left pane displays the PDF page and the right pane displays the corresponding markdown content
2. **Given** both panes are displaying page 5, **When** the user clicks "Next Page" on the pager control, **Then** both panes advance to page 6 simultaneously
3. **Given** the user is viewing page 10, **When** they use the pager to jump directly to page 3, **Then** both panes update to show page 3 content
4. **Given** a multi-page document is loaded, **When** the user scrolls through pages using arrow keys or pager buttons, **Then** both panes remain synchronized at all times
5. **Given** the user is on the last page, **When** they attempt to navigate forward, **Then** the system prevents navigation and indicates they are at the end

---

### User Story 2 - Switch Between 2-Pane and 3-Pane Modes (Priority: P2)

Users need to toggle between comparing just OCR output (2 panes) and comparing both OCR and translation outputs (3 panes) to assess both OCR accuracy and translation quality in a single workflow.

**Why this priority**: This extends the core comparison capability to include translation review. It builds on Story 1's foundation and is independently useful for users who need translation validation.

**Independent Test**: Can be tested by loading documents with original PDF, OCR markdown, and translated markdown, then toggling between 2-pane and 3-pane views to verify correct content display and synchronization in both modes.

**Acceptance Scenarios**:

1. **Given** a user has loaded documents including a translation file, **When** they select "3-Pane Mode" from a view toggle, **Then** the interface displays original PDF, OCR markdown, and translated markdown side-by-side
2. **Given** the user is in 3-pane mode on page 7, **When** they switch to 2-pane mode, **Then** the system shows only PDF and OCR markdown for page 7
3. **Given** the user is in 2-pane mode, **When** they load a document set that includes a translation file, **Then** the system offers the option to switch to 3-pane mode
4. **Given** the user switches between modes, **When** they navigate using the pager, **Then** all visible panes remain synchronized to the same page number

---

### User Story 3 - Load and Display Document Sets (Priority: P1)

Users need a simple way to select from available document sets in the configured data folder (PDF with associated markdown files in the prescribed folder structure) so they can begin comparison work.

**Why this priority**: This is a foundational capability that enables all other stories. Without document loading, no comparison can occur. Ranking this P1 because it's a prerequisite for the core workflow.

**Independent Test**: Can be tested by populating the data folder with document sets, presenting a selection UI listing available documents, and verifying that selected documents load correctly displaying the first page in the appropriate panes.

**Acceptance Scenarios**:

1. **Given** the data folder contains document sets, **When** a user opens the application, **Then** the system displays a list of available documents to choose from
2. **Given** a user selects a document from the list, **When** the system detects available language folders (raw.source, source, raw.target, target), **Then** it displays the PDF and source markdown in 2-pane mode by default
3. **Given** a user has loaded a document with both source and target language folders, **When** they request 3-pane mode, **Then** the system displays PDF, source markdown, and target markdown side-by-side
4. **Given** a user attempts to load a document with mismatched page counts between PDF and markdown files, **When** the system detects the mismatch, **Then** it displays a warning but allows viewing with clear indicators where content is missing
5. **Given** a user selects a large document, **When** the loading completes, **Then** the system displays the first page within 3 seconds and enables pager navigation

---

### Edge Cases

- What happens when the PDF has 50 pages but the OCR markdown only represents 48 pages?
- How does the system handle very large documents (500+ pages) without performance degradation?
- What happens if the user tries to load a PDF that cannot be rendered (corrupted file)?
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
- **FR-006**: Users MUST be able to switch between 2-pane and 3-pane modes without losing their current page position
- **FR-007**: System MUST scan the configured data folder and present users with a list of available document sets (PDFs with corresponding folder structures)
- **FR-008**: System MUST read the data folder path from a .env configuration file
- **FR-009**: System MUST load per-page markdown files following the naming convention `<file_name>.[raw.]<language_code>_page_<N>.md` synchronized with PDF page numbers
- **FR-010**: System MUST render images referenced in markdown files from the same directory as the markdown file for each pane
- **FR-011**: System MUST validate the folder structure and display appropriate error messages when expected files or folders are missing
- **FR-012**: System MUST display the current page number and total page count in the pager control
- **FR-013**: System MUST prevent navigation beyond the available page range (no negative pages, no pages beyond document length)
- **FR-014**: System MUST handle documents with mismatched page counts gracefully, showing available content and indicating missing pages
- **FR-015**: System MUST provide keyboard shortcuts for page navigation (arrow keys, page up/down)
- **FR-016**: System MUST render markdown content with basic formatting preserved (headings, paragraphs, lists, emphasis)
- **FR-017**: Users MUST be able to adjust the width of individual panes to focus on specific content
- **FR-018**: System MUST display loading indicators when switching pages or loading new documents
- **FR-019**: System MUST support language-specific folder naming conventions (raw.<language_code> for raw OCR, <language_code> for processed content)
- **FR-020**: System MUST reject PDF files larger than a configurable maximum file size (defined in .env file, default: 50MB) and display an appropriate error message to the user
- **FR-021**: System MUST display processed content (`<language_code>` folders) by default when both raw and processed versions are available for a language
- **FR-022**: System MUST function correctly in Chrome, Edge, Firefox, and Safari (current and 1 previous major version)

### Key Entities

- **Document Set**: Represents a collection of files following the prescribed folder structure: `<file_name>.pdf` plus `<file_name>/` directory containing language-specific subfolders (`[raw.]<language_code>/`) with per-page markdown files and images. Attributes: file name, available languages (source/target, raw/processed), page count, current page position, display mode (2-pane or 3-pane), data folder path
- **Page**: Represents a single page view within the document set, with content loaded from per-page markdown files (`<file_name>.[raw.]<language_code>_page_<N>.md`) and corresponding PDF page. Attributes: page number, content source (PDF/source language/target language), rendered content, associated images
- **Pane**: Represents a viewing area in the UI displaying content from one source (PDF, source language markdown, or target language markdown). Attributes: content type, language code, raw/processed flag, current page number, visibility state, width
- **Data Folder**: Represents the configured server-side directory containing all document sets. Attributes: folder path (from .env), available documents list

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can load a document set and begin comparing pages within 5 seconds of file selection
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
