# Implementation Tasks: OCR Translation Comparison Viewer

**Feature**: 001-ocr-translation-viewer  
**Branch**: `001-ocr-translation-viewer`  
**Created**: 2025-10-17  
**Status**: Ready for Implementation

---

## Overview

This document breaks down the implementation of the OCR Translation Comparison Viewer into actionable tasks organized by user story. Each phase represents an independently testable increment of functionality.

**Tech Stack**:
- Next.js 15 (App Router)
- TypeScript 5.3+
- React 18
- ShadCN UI + Tailwind CSS
- Vitest + React Testing Library + Playwright
- React-PDF, react-markdown
- Zustand (state management)
- Zod (validation)

**Total Estimated Tasks**: 65 tasks across 6 phases

---

## Task Legend

- `- [ ]` = Checkbox (all tasks start unchecked)
- `T###` = Task ID (sequential execution order)
- `[P]` = Parallelizable (can run concurrently with other [P] tasks)
- `[US#]` = User Story label (US1, US2, US3)
- File paths included for clarity

---

## Dependencies & Execution Order

### User Story Completion Order:
1. **Phase 1**: Setup (project initialization) - BLOCKING
2. **Phase 2**: Foundational (core infrastructure) - BLOCKING  
3. **Phase 3**: User Story 3 (P1) - Load and Display Document Sets
4. **Phase 4**: User Story 1 (P1) - Compare PDF with OCR Output
5. **Phase 5**: User Story 2 (P2) - Switch Between 2/3-Pane Modes
6. **Phase 6**: Polish & Cross-Cutting Concerns

### MVP Scope:
**Minimum Viable Product** = Phase 1 + Phase 2 + Phase 3 + Phase 4  
This delivers the core value: loading documents and comparing PDF with OCR in 2-pane mode.

---

## Phase 1: Setup & Project Initialization

**Goal**: Initialize Next.js project with all dependencies, configuration, and project structure.

**Duration**: ~2-4 hours

### Tasks:

- [ ] T001 Create Next.js 15 project with TypeScript in apps/web-viewer/ directory
- [ ] T002 [P] Install core dependencies: react, next, typescript, tailwindcss, zod, zustand
- [ ] T003 [P] Install UI dependencies: @radix-ui packages for ShadCN
- [ ] T004 [P] Install testing dependencies: vitest, @testing-library/react, @testing-library/jest-dom, playwright
- [ ] T005 [P] Install PDF dependencies: react-pdf, pdfjs-dist
- [ ] T006 [P] Install markdown dependencies: react-markdown, remark-gfm
- [ ] T007 Configure TypeScript with strict mode in tsconfig.json
- [ ] T008 [P] Configure Tailwind CSS in tailwind.config.ts
- [ ] T009 [P] Configure Vitest in vitest.config.ts with jsdom environment
- [ ] T010 [P] Configure Playwright in playwright.config.ts for multi-browser testing
- [ ] T011 [P] Configure ESLint in .eslintrc.json
- [ ] T012 [P] Configure Prettier in .prettierrc
- [ ] T013 Initialize ShadCN UI with `npx shadcn-ui@latest init`
- [ ] T014 [P] Create .env.example with DATA_FOLDER_PATH and MAX_PDF_SIZE_MB variables
- [ ] T015 [P] Create app directory structure: app/, components/, lib/, tests/
- [ ] T016 [P] Create app/globals.css with Tailwind directives
- [ ] T017 [P] Create app/layout.tsx root layout
- [ ] T018 [P] Copy PDF.js worker to public/pdf.worker.js from pdfjs-dist
- [ ] T019 [P] Create lib/types/entities.ts for TypeScript types
- [ ] T020 [P] Create lib/types/api.ts placeholder for API types
- [ ] T021 [P] Set up GitHub Actions workflow file .github/workflows/ci.yml
- [ ] T022 Verify project builds with `npm run build`
- [ ] T023 Verify tests run with `npm test`

---

## Phase 2: Foundational Infrastructure

**Goal**: Build core utilities, schemas, and API infrastructure that all user stories depend on.

**Duration**: ~4-6 hours

### Tasks:

- [ ] T024 [P] Create Zod schema for language codes (IETF BCP 47 format) in lib/schemas/common.ts
- [ ] T025 [P] Create Zod schema for DocumentSet in lib/schemas/document.ts
- [ ] T026 [P] Create Zod schema for LanguageVersion in lib/schemas/document.ts
- [ ] T027 [P] Create Zod schema for PageFile in lib/schemas/page.ts
- [ ] T028 [P] Create Zod schema for ViewerState in lib/schemas/viewer.ts
- [ ] T029 [P] Create file system utility functions in lib/utils/file-system.ts (path validation, directory scanning)
- [ ] T030 [P] Create environment validation utility in lib/utils/env.ts using Zod (validate DATA_FOLDER_PATH and MAX_PDF_SIZE_MB)
- [ ] T031 [P] Create Zustand store for documents in lib/stores/useDocumentStore.ts
- [ ] T032 [P] Create Zustand store for viewer state in lib/stores/useViewerStore.ts
- [ ] T033 [P] Create error handling utilities in lib/utils/errors.ts
- [ ] T034 [P] Add ShadCN Button component with `npx shadcn-ui@latest add button`
- [ ] T035 [P] Add ShadCN Select component with `npx shadcn-ui@latest add select`
- [ ] T036 [P] Add ShadCN Card component with `npx shadcn-ui@latest add card`
- [ ] T037 [P] Add ShadCN Slider component with `npx shadcn-ui@latest add slider`
- [ ] T038 [P] Create test utilities and helpers in tests/helpers/setup.ts
- [ ] T039 [P] Create mock data factory for testing in tests/helpers/mocks.ts
- [ ] T040 [P] Write unit tests for Zod schemas in tests/unit/schemas/
- [ ] T041 [P] Write unit tests for file system utilities in tests/unit/utils/file-system.test.ts
- [ ] T042 [P] Write unit tests for Zustand stores in tests/unit/stores/
- [ ] T042a [P] Create performance smoke test for document load time (verify < 5s per SC-001) in tests/integration/performance-smoke.test.ts

---

## Phase 3: User Story 3 (P1) - Load and Display Document Sets

**Goal**: Enable users to browse and select documents from the configured data folder.

**User Story**: Users need a simple way to select from available document sets in the configured data folder.

**Independent Test**: Populate data folder with document sets, verify UI lists documents, user can select and load first page.

**Duration**: ~6-8 hours

### Tasks:

#### API Layer
- [ ] T043 [P] [US3] Create GET /api/documents route in app/api/documents/route.ts (scan data folder, return document list)
- [ ] T044 [P] [US3] Create GET /api/documents/[documentId]/route in app/api/documents/[documentId]/route.ts (return document details)
- [ ] T045 [P] [US3] Create POST /api/documents/[documentId]/validate/route in app/api/documents/[documentId]/validate/route.ts (validate structure)
- [ ] T045a [P] [US3] Add error response schema to OpenAPI contract in contracts/openapi.yaml (code, message, details fields)
- [ ] T045b [P] [US3] Implement PDF size validation in document loading API (reject if > MAX_PDF_SIZE_MB with 413 status)
- [ ] T046 [P] [US3] Write integration tests for document API routes in tests/integration/api/documents.test.ts

#### Components
- [ ] T047 [US3] Create DocumentSelector component in components/viewer/DocumentSelector.tsx (display document list)
- [ ] T048 [P] [US3] Write unit tests for DocumentSelector in tests/unit/components/DocumentSelector.test.tsx
- [ ] T049 [US3] Create DocumentCard component in components/viewer/DocumentCard.tsx (individual document display)
- [ ] T050 [P] [US3] Write unit tests for DocumentCard in tests/unit/components/DocumentCard.test.tsx
- [ ] T051 [US3] Add document selection logic to useDocumentStore in lib/stores/useDocumentStore.ts
- [ ] T051b [US3] Implement default content preference (processed over raw) in useDocumentStore per FR-021
- [ ] T052 [P] [US3] Create API client functions in lib/api/documents.ts for fetching documents

#### Integration
- [ ] T053 [US3] Create main page with DocumentSelector in app/(viewer)/page.tsx
- [ ] T054 [US3] Implement document loading flow (select → validate → load)
- [ ] T055 [US3] Add loading states and error handling for document operations
- [ ] T056 [P] [US3] Write E2E test for document selection in tests/e2e/document-selection.spec.ts

---

## Phase 4: User Story 1 (P1) - Compare PDF with OCR Output

**Goal**: Display PDF and markdown side-by-side with synchronized navigation.

**User Story**: Users need to verify OCR accuracy by viewing PDF and markdown side-by-side.

**Independent Test**: Load document, verify 2 panes display (PDF + markdown), navigate pages, verify synchronization.

**Duration**: ~10-12 hours

### Tasks:

#### API Layer
- [ ] T057 [P] [US1] Create GET /api/documents/[documentId]/pages/[pageNumber]/pdf/route in app/api/documents/[documentId]/pages/[pageNumber]/pdf/route.ts
- [ ] T058 [P] [US1] Create GET /api/documents/[documentId]/pages/[pageNumber]/markdown/route in app/api/documents/[documentId]/pages/[pageNumber]/markdown/route.ts
- [ ] T059 [P] [US1] Create GET /api/documents/[documentId]/images/[...path]/route for markdown images
- [ ] T060 [P] [US1] Write integration tests for page content API routes in tests/integration/api/pages.test.ts

#### PDF Rendering
- [ ] T061 [US1] Create PDF rendering utility in lib/utils/pdf-renderer.ts using React-PDF
- [ ] T062 [US1] Create PdfPane component in components/viewer/PdfPane.tsx
- [ ] T063 [P] [US1] Write unit tests for PdfPane in tests/unit/components/PdfPane.test.tsx
- [ ] T064 [US1] Implement PDF page loading with error boundaries
- [ ] T065 [US1] Add PDF worker configuration in app/layout.tsx

#### Markdown Rendering
- [ ] T066 [US1] Create markdown parsing utility in lib/utils/markdown-parser.ts
- [ ] T067 [US1] Create MarkdownPane component in components/viewer/MarkdownPane.tsx with react-markdown
- [ ] T068 [P] [US1] Write unit tests for MarkdownPane in tests/unit/components/MarkdownPane.test.tsx
- [ ] T069 [US1] Implement image resolution for markdown content
- [ ] T069b [US1] Implement missing image placeholder with alt text fallback
- [ ] T070 [US1] Add syntax highlighting for code blocks if needed

#### Navigation
- [ ] T071 [US1] Create Pager component in components/viewer/Pager.tsx (prev/next/jump controls)
- [ ] T072 [P] [US1] Write unit tests for Pager in tests/unit/components/Pager.test.tsx
- [ ] T073 [US1] Implement keyboard navigation (arrow keys, page up/down) in Pager
- [ ] T074 [US1] Add page number validation and boundary checks
- [ ] T075 [US1] Update useViewerStore to manage current page state

#### Layout & Synchronization
- [ ] T076 [US1] Create PaneContainer component in components/viewer/PaneContainer.tsx (2-pane layout)
- [ ] T077 [US1] Create Viewer component in components/viewer/Viewer.tsx (main container)
- [ ] T078 [US1] Implement pane synchronization logic (ensure both panes show same page)
- [ ] T079 [US1] Add pane resizing functionality (adjustable widths)
- [ ] T080 [P] [US1] Write unit tests for PaneContainer in tests/unit/components/PaneContainer.test.tsx

#### Integration
- [ ] T081 [US1] Integrate Viewer component into main page app/(viewer)/page.tsx
- [ ] T082 [US1] Connect pager controls to viewer state
- [ ] T083 [US1] Add loading indicators for page transitions
- [ ] T084 [US1] Implement prefetching for adjacent pages (N-1, N+1) using requestIdleCallback or 200ms after page load (whichever first)
- [ ] T085 [P] [US1] Write E2E test for 2-pane viewing and navigation in tests/e2e/viewer-navigation.spec.ts

---

## Phase 5: User Story 2 (P2) - Switch Between 2-Pane and 3-Pane Modes

**Goal**: Allow users to toggle between 2-pane (PDF + OCR) and 3-pane (PDF + OCR + translation) modes.

**User Story**: Users need to compare OCR and translation outputs in a single workflow.

**Independent Test**: Load document with translation, toggle to 3-pane mode, verify all panes synchronized.

**Duration**: ~4-6 hours

### Tasks:

#### Mode Switching
- [ ] T086 [US2] Create ModeToggle component in components/viewer/ModeToggle.tsx (2-pane/3-pane switcher)
- [ ] T087 [P] [US2] Write unit tests for ModeToggle in tests/unit/components/ModeToggle.test.tsx
- [ ] T088 [US2] Update useViewerStore to manage pane mode state (TWO_PANE / THREE_PANE)
- [ ] T089 [US2] Update PaneContainer to support 3-pane layout
- [ ] T090 [US2] Implement logic to detect available language versions (source + target)
- [ ] T091 [US2] Add conditional rendering based on pane mode

#### Layout Adjustments
- [ ] T092 [US2] Update pane width calculations for 3-pane mode (equal distribution or configurable)
- [ ] T093 [US2] Ensure synchronization works across all 3 panes
- [ ] T094 [US2] Add responsive layout handling for narrow viewports
- [ ] T095 [US2] Preserve page position when switching modes

#### Integration
- [ ] T096 [US2] Integrate ModeToggle into Viewer component
- [ ] T097 [US2] Add mode persistence in URL query params for bookmarking
- [ ] T098 [P] [US2] Write E2E test for mode switching in tests/e2e/mode-switching.spec.ts
- [ ] T099 [P] [US2] Write E2E test for 3-pane synchronization in tests/e2e/three-pane-sync.spec.ts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Add polish, accessibility, performance optimizations, and documentation.

**Duration**: ~6-8 hours

### Tasks:

#### Performance Optimization
- [ ] T100 [P] Implement React.memo for Pane components to prevent unnecessary re-renders
- [ ] T101 [P] Add code splitting with dynamic imports for PDF/markdown renderers
- [ ] T102 [P] Optimize bundle size analysis and tree-shaking
- [ ] T102b [P] Configure Next.js cache headers for API routes (metadata: 1hr, pages: stale-while-revalidate)
- [ ] T103 [P] Add performance monitoring in tests/e2e/performance.spec.ts

#### Accessibility
- [ ] T104 [P] Add ARIA labels to all interactive elements (panes, pager, mode toggle)
- [ ] T105 [P] Ensure proper focus management and tab order
- [ ] T106 [P] Add screen reader announcements for page changes
- [ ] T107 [P] Write accessibility tests with axe-core in tests/e2e/accessibility.spec.ts
- [ ] T108 [P] Manual testing with NVDA/JAWS/VoiceOver screen readers

#### Error Handling & Edge Cases
- [ ] T109 [P] Implement global error boundary in app/error.tsx
- [ ] T110 [P] Add user-friendly error messages for all failure scenarios
- [ ] T111 [P] Handle missing pages gracefully (show placeholder)
- [ ] T112 [P] Handle corrupted PDF files with clear error messages
- [ ] T113 [P] Handle oversized PDFs (exceeds MAX_PDF_SIZE_MB) with 413 response

#### Security
- [ ] T114 [P] Implement path traversal prevention in file system utilities
- [ ] T115 [P] Add Content Security Policy headers in next.config.mjs
- [ ] T116 [P] Write security tests for path validation in tests/integration/security.spec.ts
- [ ] T117 [P] Audit dependencies for vulnerabilities with npm audit

#### Documentation
- [ ] T118 [P] Update README.md with project overview and quick start
- [ ] T119 [P] Document environment variables in .env.example
- [ ] T120 [P] Create API documentation from OpenAPI schema
- [ ] T121 [P] Add inline TSDoc comments to public APIs
- [ ] T122 [P] Create deployment guide in docs/deployment.md

#### CI/CD
- [ ] T123 Create GitHub Actions workflow to run all tests (lint, unit, integration, e2e)
- [ ] T124 [P] Add coverage reporting with Codecov
- [ ] T125 [P] Add build verification step
- [ ] T126 [P] Configure branch protection rules (require passing tests)

#### Final Validation
- [ ] T127 Run full test suite and verify 70%+ coverage
- [ ] T128 Test in all supported browsers (Chrome, Firefox, Safari, Edge)
- [ ] T128a [P] Manual test: Verify markdown element support >= 90% per SC-006
- [ ] T128b [P] E2E test for data folder error scenarios (misconfigured path, missing folders)
- [ ] T129 Perform manual QA against all acceptance scenarios
- [ ] T130 Constitution check: Verify all 5 principles pass

---

## Parallel Execution Opportunities

*Note: Tasks marked with [P] in the task list can be executed in parallel. This section provides a quick-reference summary for planning work distribution.*

### Within Phase 3 (US3):
- T043, T044, T045 (API routes) can run in parallel
- T047, T049 (Components) can run in parallel after API routes
- T048, T050, T046 (Tests) can run in parallel

### Within Phase 4 (US1):
- T057, T058, T059 (API routes) can run in parallel
- T061-T065 (PDF rendering) can run in parallel with T066-T070 (Markdown rendering)
- T071-T075 (Pager) can run in parallel with T076-T080 (Layout)
- All unit tests (T063, T068, T072, T080) can run in parallel

### Within Phase 5 (US2):
- T086-T091 (Mode switching logic) can run before T092-T095 (Layout adjustments)
- T087, T098, T099 (Tests) can run in parallel

### Within Phase 6 (Polish):
- T100-T103 (Performance) can run in parallel
- T104-T108 (Accessibility) can run in parallel
- T109-T113 (Error handling) can run in parallel
- T114-T117 (Security) can run in parallel
- T118-T122 (Documentation) can run in parallel

---

## Implementation Strategy

### Recommended Approach:
1. **Week 1**: Complete Phase 1 + Phase 2 (Setup + Foundational)
2. **Week 2**: Complete Phase 3 (US3 - Document Loading)
3. **Week 3-4**: Complete Phase 4 (US1 - Core Comparison View)
4. **Week 5**: Complete Phase 5 (US2 - Mode Switching)
5. **Week 6**: Complete Phase 6 (Polish)

### MVP Delivery:
**MVP = Phases 1-4** (Weeks 1-4)
- Delivers core value: Load documents and compare PDF with OCR
- 2-pane viewing with synchronized navigation
- ~70% of total functionality

### Incremental Releases:
- **v0.1**: MVP (2-pane comparison)
- **v0.2**: + 3-pane mode (translation support)
- **v1.0**: + Full polish (accessibility, performance, documentation)

---

## Task Summary

| Phase | Tasks | Parallelizable | User Story | Duration |
|-------|-------|----------------|------------|----------|
| Phase 1: Setup | 23 (T001-T023) | 15 | - | 2-4 hours |
| Phase 2: Foundation | 20 (T024-T042, T042a) | 18 | - | 4-6 hours |
| Phase 3: US3 | 16 (T043-T056, T045a, T045b, T051b) | 11 | P1 | 6-8 hours |
| Phase 4: US1 | 30 (T057-T085, T069b) | 15 | P1 | 10-12 hours |
| Phase 5: US2 | 14 (T086-T099) | 5 | P2 | 4-6 hours |
| Phase 6: Polish | 35 (T100-T130, T102b, T128a, T128b) | 27 | - | 6-8 hours |
| **TOTAL** | **138 tasks** | **91 parallelizable** | | **32-44 hours** |

---

## Next Steps

1. ✅ Review and approve this task breakdown
2. ⏭️ Begin Phase 1: Setup & Project Initialization
3. ⏭️ Set up development environment per quickstart.md
4. ⏭️ Follow TDD approach: Write test → Implement → Refactor
5. ⏭️ Track progress by checking off tasks as completed

---

**Document Status**: ✅ COMPLETE (Updated with analysis recommendations)  
**Ready for**: Implementation  
**Last Updated**: 2025-10-18
