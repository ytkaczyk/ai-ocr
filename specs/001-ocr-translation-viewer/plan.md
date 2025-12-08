# Implementation Plan: OCR Translation Comparison Viewer

**Branch**: `001-ocr-translation-viewer` | **Date**: 2025-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-ocr-translation-viewer/spec.md`

---

## Summary

The OCR Translation Comparison Viewer is a Next.js 16 web application that enables users to compare original PDF documents with their OCR-extracted and translated markdown outputs side-by-side. The system supports both 2-pane (PDF + OCR) and 3-pane (PDF + OCR + translation) viewing modes with synchronized page navigation. Documents are pre-loaded in a configured server-side data folder; no file uploads are required. The application follows test-driven development principles with comprehensive test coverage, automated CI/CD via GitHub Actions, and strict adherence to constitution principles for code quality, accessibility, security, and performance.

**Terminology**: "DocumentSet" (entity) vs "document set" (general reference). See spec.md for complete terminology glossary.

**Key Technical Decisions**:
- Next.js 16 App Router for full-stack React framework
- ShadCN UI component library for accessible, customizable components
- IETF BCP 47 language tags (e.g., `en-US`, `es-ES`, `fr-CA`) for internationalization
- Test-driven development with Vitest and Playwright
- GitHub Actions for automated CI/CD pipeline

---

## Technical Context

**Language/Version**: TypeScript 5.3+ / Node.js 20.x  
**Framework**: Next.js 16 (App Router with Server Components and Server Actions)  
**Primary Dependencies**: 
- React 19 (UI library)
- ShadCN (UI component library built on Radix UI + Tailwind CSS)
- React-PDF (client-side PDF rendering via PDF.js)
- react-markdown + remark-gfm (secure markdown rendering)
- Zustand (client-side state management)
- Zod (runtime validation for API contracts)
- Vitest + React Testing Library (unit/integration testing)
- Playwright (end-to-end testing)

**Storage**: File system (server-side data folder), no database required  
**Testing**: 
- Unit/Integration: Vitest + React Testing Library (TDD workflow)
- E2E: Playwright with multi-browser support
- Coverage Target: 70% minimum (90% for critical paths)

**Target Platform**: Google Chrome (current + 1 previous major version)  
**Project Type**: Web application (Next.js full-stack)  
**Performance Goals**: 
- Document load: < 5 seconds for initial page display
- Page navigation: < 500ms for pane synchronization
- Support documents: Up to 200 pages without degradation

**Constraints**: 
- PDF max size: Configurable via .env (default 50MB)
- No file uploads: Pre-configured data folder only
- Prescribed folder structure: `<file>.pdf` + `<file>/[raw.]<lang-COUNTRY>/<file>.[raw.]<lang-COUNTRY>_page_<N>.md`
- Language codes: IETF BCP 47 format (e.g., `en-US`, `es-ES`, `fr-CA`)
- Keyboard accessibility: Full navigation without mouse

**Scale/Scope**: 
- Target users: Internal QA teams, OCR engineers
- Expected documents: 10-100 document sets per deployment
- Concurrent users: 5-10 (single-tenant deployments)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality & Maintainability: **PASS**

**Evidence**: 
- ESLint + Prettier enforced via CI (blocking merge)
- TypeScript strict mode enabled (`tsconfig.json`)
- Public APIs documented with TSDoc comments
- README.md and quickstart.md for onboarding
- Component library (ShadCN) ensures consistent patterns
- Modular structure: `components/`, `lib/`, `app/` separation

**Links**: 
- Linting config: `eslint.config.js`
- TS config: `tsconfig.json`
- Developer guide: `specs/001-ocr-translation-viewer/quickstart.md`

---

### II. Test-First & Coverage Minimums: **PASS**

**Evidence**: 
- TDD workflow documented in quickstart.md
- Vitest configured for fast feedback (<100ms per test)
- Test structure: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- Coverage reports in CI pipeline (Codecov integration)
- Minimum 70% coverage enforced via GitHub Actions gate

**Target Coverage**:
| Module | Target | Rationale |
|--------|--------|-----------|
| API routes | 90% | Critical path for data loading |
| Viewer components | 80% | Complex state synchronization |
| Utility functions | 70% | General helpers |
| UI components | 60% | Visual components, E2E coverage |

**Test Types**:
- Unit: Component behavior, utility functions, validation logic
- Integration: API routes with file system, state management flows
- Contract: API responses match OpenAPI schema (Zod validation)
- E2E: Multi-pane synchronization, keyboard navigation, mode switching

**Links**:
- Test config: `vitest.config.ts`, `playwright.config.ts`
- TDD workflow: `specs/001-ocr-translation-viewer/quickstart.md#development-workflow-tdd`

---

### III. UX Consistency & Accessibility: **PASS**

**Evidence**: 
- ShadCN component library (Radix UI primitives with ARIA attributes)
- Tailwind design tokens for consistent spacing, colors, typography
- Keyboard navigation: Arrow keys, Page Up/Down, Tab order
- Semantic HTML: Proper landmarks, heading hierarchy
- Focus indicators: Visible on all interactive elements
- Screen reader support: ARIA labels on panes, pager controls

**UX Checklist**:
- ✅ Keyboard-only navigation tested
- ✅ Focus management on pane content
- ✅ Color contrast >= 4.5:1 (Tailwind default theme)
- ✅ Responsive layout with device-appropriate UX (FR-025a through FR-025d):
  - Optimal desktop (≥ 1440px): Side-by-side panes with adjustable widths
  - Standard desktop (1024px - 1439px): Side-by-side panes with reduced minimum width
  - Tablet/small desktop (768px - 1023px): Vertically stacked panes with warning banner
  - Mobile (< 768px): Graceful degradation with viewport requirement message
  - All breakpoints tested across browsers, maintain accessibility and keyboard navigation
- ✅ Loading states for async operations (FR-018a through FR-018e):
  - Document list scanning with skeleton/spinner
  - Document loading with progress indicator
  - Page transitions with loading in affected panes (< 500ms per SC-002)
  - Pane rendering with placeholders/skeletons
  - Mode switching with indicators (2-pane ↔ 3-pane)
  - All loading indicators accessible (ARIA live regions, non-blocking)
- ✅ Error messages user-friendly (not technical) with recovery options (FR-011a through FR-011d):
  - File system errors: Specific messages for missing folders, permissions, invalid structure
  - PDF parsing errors: Specific messages for corrupted files, unsupported formats, rendering failures
  - Markdown rendering errors: Specific messages for missing files, malformed content, invalid images
  - Folder validation errors: Specific messages for invalid language codes, missing versions, incomplete pages
  - All error messages include recovery actions and are accessible (ARIA roles, semantic HTML)
- ✅ Zero-state scenarios with actionable feedback (FR-023a through FR-023c):
  - Empty data folder: Instructions for adding documents with folder structure example
  - No valid documents: Validation help with structure requirements and documentation link
  - Unconfigured data folder: Setup instructions for .env file configuration
  - All zero-state messages accessible with ARIA live regions
- ✅ Concurrent interactions handled gracefully (FR-024a through FR-024d):
  - Rapid page navigation: Debounced with in-flight cancellation, no blocking
  - Mode switching during load: Queued with clear loading indicators
  - Pane resize during navigation: Non-blocking with debounced persistence
  - Multiple document selections: Cancellation of stale loads, immediate state clearing
  - All interactions maintain UI responsiveness and data consistency

**Accessibility Testing**:
- Manual: Keyboard navigation, screen reader (NVDA/JAWS/VoiceOver)
- Automated: axe-core via Playwright (`@axe-core/playwright`)

**Links**:
- Component library: `components/ui/` (ShadCN)
- A11y tests: `tests/e2e/accessibility.spec.ts`

---

### IV. Security & Data Protection: **PASS**

**Evidence**:
- No secrets in code: .env.local gitignored, .env.example as template
- Input validation: Zod schemas for all API inputs (document IDs, page numbers, language codes)
- File path sanitization: `path.resolve()` with `startsWith()` checks to prevent directory traversal (FR-033a)
- Comprehensive security requirements (FR-033a through FR-033e):
  - Path traversal prevention: Validate paths, reject `..` and absolute paths, startsWith(DATA_FOLDER_PATH) check
  - Filename validation: Regex `^[a-zA-Z0-9_-]+$`, reject special chars, null bytes, excessive length
  - Symlink handling: Reject symbolic links, validate resolved paths
  - Input sanitization: IETF BCP 47 language codes, positive integer page numbers, 1-100 pane widths
  - Error message safety: No internal path disclosure, generic messages with error codes
- No user data storage: Stateless application, no authentication required (single-tenant)
- Dependency scanning: GitHub Dependabot enabled, high/critical vulns block merge
- Content Security Policy: Next.js headers configured to restrict script sources

**Threat Model**:
| Threat | Mitigation |
|--------|------------|
| Directory traversal | Path validation (FR-033a), allowlist data folder only, reject `..` patterns |
| XSS in markdown | react-markdown (no dangerouslySetInnerHTML), HTML entity escaping (FR-030d) |
| PDF exploits | PDF.js in Web Worker (sandboxed) |
| Malicious file names | Regex validation (FR-033b), slug format required |
| Symlink attacks | Reject symlinks (FR-033c), validate resolved paths |
| Input injection | Zod schema validation, regex patterns for all user inputs (FR-033d) |

**Security Tests**:
- Path traversal attempts rejected (FR-033a tests)
- Invalid document IDs return 404
- Oversized PDFs rejected with 413 error
- Markdown with script tags sanitized (FR-030d)
- Malicious filename patterns rejected (FR-033b tests)
- Symlink exploitation attempts blocked (FR-033c tests)
- Oversized PDFs rejected with 413 error
- Markdown with script tags sanitized

**Links**:
- Validation schemas: `lib/schemas/`
- Security tests: `tests/integration/security.spec.ts`

---

### V. Performance & Resource Efficiency: **PASS**

**Evidence**:
- Lazy loading: Only current page rendered, adjacent pages prefetched
- PDF rendering: Web Worker offloads parsing from main thread
- Code splitting: Dynamic imports for PDF/markdown renderers
- Image optimization: Next.js `<Image>` component for markdown images
- Memoization: `React.memo` on Pane components to prevent unnecessary re-renders
- Caching: API routes cache document metadata (1 hour), page content (stale-while-revalidate)
- Performance degradation handling (FR-031a through FR-031d):
  - Large document warnings (200-500 pages), blocking modal (>500 pages)
  - Continuous monitoring (track nav time), warning banner if performance degrades
  - Graceful degradation: reduce prefetch, disable smooth scrolling, lower PDF quality
- Memory management (FR-032a through FR-032d):
  - 500MB memory limit (configurable via MEMORY_LIMIT_MB)
  - Memory pressure detection (80% threshold triggers cleanup)
  - High-res image compression (max 2000×2000px), lazy loading, unload distant pages

**Performance Benchmarks**:
| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial page load (LCP) | < 2.5s (SC-001) | Lighthouse CI, fail CI if > 5s on 3 runs |
| Page navigation | < 500ms (SC-002) | Playwright timing, average of 10 transitions |
| Memory usage (200 pages) | < 500MB (FR-032a) | Chrome DevTools profiling, Performance API |
| Bundle size (gzipped) | < 300KB | Next.js build output |
| Large doc (200-500 pages) | Degrade gracefully (FR-031a) | Test with fixtures, monitor nav time |
| Large doc (>500 pages) | Display warning modal (FR-031b) | User confirmation required |

**Optimization Strategies**:
- Prefetch N-1 and N+1 pages on idle (N±3 for large docs per FR-031a)
- Virtual scrolling if markdown content exceeds viewport
- PDF scale adjusted for device pixel ratio (reduce to 1x under memory pressure per FR-031d)
- Debounced pane width adjustments (500ms per FR-024c)
- Aggressive cleanup at 80% memory threshold (FR-032b)
- Progressive PDF rendering for high-res documents (FR-029d)**Links**:
- Performance tests: `tests/e2e/performance.spec.ts`
- Benchmarks: CI pipeline reports

---

## Project Structure

### Documentation (this feature)

```
specs/001-ocr-translation-viewer/
├── plan.md              # This file (/speckit.plan output)
├── spec.md              # Feature specification (/speckit.specify output)
├── research.md          # Phase 0 output (technology choices)
├── data-model.md        # Phase 1 output (entities and relationships)
├── quickstart.md        # Phase 1 output (developer guide)
├── contracts/           # Phase 1 output (API contracts)
│   ├── openapi.yaml     # OpenAPI 3.1 specification
│   └── README.md        # Contract testing strategy
├── checklists/          # Quality gates
│   └── requirements.md  # Spec validation checklist
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT YET CREATED)
```

### Source Code (repository root: apps/web-viewer)

```
apps/web-viewer/
├── app/                       # Next.js App Router
│   ├── api/                   # Server-side API routes
│   │   ├── documents/
│   │   │   ├── route.ts       # GET /api/documents (list all)
│   │   │   └── [documentId]/
│   │   │       ├── route.ts   # GET /api/documents/:id (details)
│   │   │       ├── validate/
│   │   │       │   └── route.ts  # POST /api/documents/:id/validate
│   │   │       ├── pages/
│   │   │       │   └── [pageNumber]/
│   │   │       │       ├── pdf/
│   │   │       │       │   └── route.ts  # GET PDF page
│   │   │       │       └── markdown/
│   │   │       │           └── route.ts  # GET markdown page
│   │   │       └── images/
│   │   │           └── [...path]/
│   │   │               └── route.ts  # GET image file
│   │   └── viewer/
│   │       └── state/
│   │           └── route.ts   # GET/POST viewer state
│   ├── (viewer)/              # Route group for viewer pages
│   │   ├── page.tsx           # Main viewer page (/)
│   │   └── layout.tsx         # Viewer-specific layout
│   ├── layout.tsx             # Root layout (global styles, providers)
│   ├── globals.css            # Tailwind directives + global styles
│   └── error.tsx              # Error boundary
│
├── components/                # React components
│   ├── ui/                    # ShadCN UI components (copy-pasted)
│   │   ├── button.tsx
│   │   ├── select.tsx
│   │   ├── card.tsx
│   │   ├── slider.tsx
│   │   └── ...
│   ├── viewer/                # Feature-specific components
│   │   ├── DocumentSelector.tsx  # List of available documents
│   │   ├── Viewer.tsx            # Main viewer container
│   │   ├── PaneContainer.tsx     # Pane layout manager
│   │   ├── PdfPane.tsx           # PDF rendering pane
│   │   ├── MarkdownPane.tsx      # Markdown rendering pane
│   │   ├── Pager.tsx             # Page navigation controls
│   │   └── ModeToggle.tsx        # 2-pane / 3-pane switcher
│   └── providers/             # Context providers
│       └── ViewerProvider.tsx # Zustand store provider
│
├── lib/                       # Shared utilities
│   ├── api/                   # API client functions
│   │   ├── documents.ts       # Document-related API calls
│   │   └── viewer.ts          # Viewer state API calls
│   ├── schemas/               # Zod validation schemas
│   │   ├── document.ts        # DocumentSet, LanguageVersion
│   │   ├── page.ts            # PageContent schemas
│   │   └── viewer.ts          # ViewerState schemas
│   ├── stores/                # Zustand stores
│   │   ├── useDocumentStore.ts   # Document selection state
│   │   └── useViewerStore.ts     # Page navigation, pane mode
│   ├── utils/                 # Helper functions
│   │   ├── file-system.ts     # Server-side file operations
│   │   ├── pdf-renderer.ts    # PDF rendering utilities
│   │   ├── markdown-parser.ts # Markdown processing
│   │   └── validation.ts      # Common validators
│   └── types/                 # TypeScript type definitions
│       ├── api.ts             # Generated from OpenAPI
│       └── entities.ts        # Data model types
│
├── tests/                     # Test files
│   ├── unit/                  # Unit tests (co-located or here)
│   │   ├── components/
│   │   ├── utils/
│   │   └── stores/
│   ├── integration/           # Integration tests
│   │   ├── api/               # API route tests
│   │   └── workflows/         # Multi-component flows
│   └── e2e/                   # Playwright E2E tests
│       ├── viewer.spec.ts     # Main viewer workflows
│       ├── navigation.spec.ts # Page navigation
│       ├── accessibility.spec.ts
│       └── performance.spec.ts
│
├── public/                    # Static assets
│   ├── pdf.worker.js          # PDF.js worker (copied from pdfjs-dist)
│   └── favicon.ico
│
├── .github/                   # GitHub configuration
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI pipeline
│
├── .env.example               # Example environment variables
├── .env.local                 # Local environment (gitignored)
├── .eslintrc.json             # ESLint configuration
├── .prettierrc                # Prettier configuration
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── vitest.config.ts           # Vitest test configuration
├── playwright.config.ts       # Playwright E2E configuration
├── next.config.mjs            # Next.js configuration
└── README.md                  # Project overview
```

**Structure Decision**: Web application structure using Next.js App Router. The `app/` directory follows Next.js conventions with API routes in `app/api/` and UI pages in `app/(viewer)/`. Components are separated into reusable UI primitives (`components/ui/`) and feature-specific logic (`components/viewer/`). Server-side utilities in `lib/utils/` handle file system operations, while client-side stores in `lib/stores/` manage UI state. Tests are organized by type (unit/integration/e2e) for clarity.

---

## Complexity Tracking

*No violations to report. All architecture decisions align with constitution principles.*

---

## Implementation Phases

### Phase 0: Research & Technology Selection ✅ COMPLETE

**Artifacts Created**:
- ✅ `research.md`: Technology stack decisions documented
- ✅ Best practices gathered for Next.js 16, ShadCN, TDD, GitHub Actions

**Key Decisions**:
1. Next.js 16 (App Router) for full-stack framework
2. ShadCN + Tailwind for accessible UI components
3. Vitest for fast TDD cycle
4. React-PDF for client-side PDF rendering
5. Zustand for lightweight state management
6. GitHub Actions for CI/CD
7. IETF BCP 47 language tags (e.g., `en-US`, `es-ES`, `fr-CA`)

---

### Phase 1: Design & Contracts ✅ COMPLETE

**Artifacts Created**:
- ✅ `data-model.md`: 7 entities defined with relationships and validation rules
- ✅ `contracts/openapi.yaml`: Complete OpenAPI 3.1 specification with 8 endpoints
- ✅ `contracts/README.md`: Contract testing strategy and implementation notes
- ✅ `quickstart.md`: Developer onboarding guide with setup instructions

**Entities Defined**:
1. DocumentSet
2. LanguageVersion (using IETF BCP 47 format)
3. PageFile
4. Page
5. Pane
6. ViewerState
7. DataFolder

**API Endpoints**:
- GET /api/documents
- GET /api/documents/{id}
- POST /api/documents/{id}/validate
- GET /api/documents/{id}/pages/{n}/pdf
- GET /api/documents/{id}/pages/{n}/markdown
- GET /api/documents/{id}/images/{lang}/{path}
- GET /api/viewer/state
- POST /api/viewer/state

---

### Phase 2: Implementation Tasks ⏭️ NEXT

**Command**: `/speckit.tasks`

This phase will generate detailed task breakdown with:
- Task hierarchy (T-001, T-002, etc.)
- Dependencies between tasks
- Estimated complexity
- Constitution-specific tasks (T-CON-01 through T-CON-05)
- Testing requirements per task

**Not included in this plan document** per workflow instructions.

---

## Development Workflow

### 1. Environment Setup

```bash
# Clone and navigate
cd apps/web-viewer

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with DATA_FOLDER_PATH

# Run tests to verify setup
npm test
```

### 2. TDD Cycle

```typescript
// 1. Write failing test
describe('DocumentSelector', () => {
  it('displays list of available documents', async () => {
    render(<DocumentSelector />);
    await waitFor(() => {
      expect(screen.getByText('contract-2024')).toBeInTheDocument();
    });
  });
});

// 2. Run test (should fail)
npm run test:watch

// 3. Implement minimal code to pass
export function DocumentSelector() {
  const { documents } = useDocumentStore();
  return (
    <ul>
      {documents.map(doc => <li key={doc.id}>{doc.fileName}</li>)}
    </ul>
  );
}

// 4. Test passes → refactor → commit
git commit -m "feat: add DocumentSelector component"
```

### 3. Component Development Order

**Priority 1: Core Viewing (US-001)**
1. API routes: GET /api/documents, GET /api/documents/{id}
2. DocumentSelector component
3. PdfPane component (React-PDF integration)
4. MarkdownPane component (react-markdown)
5. Pager component
6. Viewer container with synchronization logic
7. E2E test: Load document and navigate pages

**Priority 2: Mode Switching (US-002)**
1. ModeToggle component
2. PaneContainer responsive layout
3. Update ViewerState store for mode management
4. E2E test: Toggle between 2-pane and 3-pane

**Priority 3: Document Loading (US-003)**
1. DataFolder scanning logic (server-side)
2. Validation endpoint: POST /api/documents/{id}/validate
3. Loading states and error handling
4. E2E test: Load invalid document with warnings

### 4. CI/CD Pipeline

**GitHub Actions Workflow** (`.github/workflows/ci.yml`):

```yaml
name: CI

on:
  push:
    branches: [main, 001-ocr-translation-viewer]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
      - name: Check coverage threshold
        run: |
          if [ $(cat coverage/coverage-summary.json | jq '.total.lines.pct') -lt 70 ]; then
            echo "Coverage below 70%"
            exit 1
          fi

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build

  e2e:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps ${{ matrix.browser }}
      - run: npm run test:e2e -- --project=${{ matrix.browser }}
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/
```

**Merge Gates**:
- ✅ Linting passes (ESLint)
- ✅ Unit/integration tests pass
- ✅ Coverage >= 70%
- ✅ Production build succeeds
- ✅ E2E tests pass in all browsers
- ✅ Constitution checklist completed in PR

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Large PDFs cause browser memory issues | Medium | High | Implement page-by-page rendering, prefetch limit to 3 pages, monitor memory usage |
| PDF.js worker loading fails | Low | High | Fallback to main thread rendering with warning, clear error messages |
| Markdown with complex formatting breaks layout | Medium | Medium | Test with diverse markdown samples, constrain pane max-width, horizontal scroll |
| Slow file system scanning on large folders | Low | Medium | Cache document list, implement pagination if >100 documents, background refresh |
| Keyboard navigation conflicts with browser shortcuts | Low | Low | Document key bindings, allow Escape to blur custom handlers |
| Language code parsing issues | Low | Medium | Strict regex validation for IETF BCP 47 format, clear error messages for invalid codes |

---

## Deployment Considerations

### Production Readiness Checklist

- [ ] Environment variables validated with Zod
- [ ] DATA_FOLDER_PATH permissions verified (read-only sufficient)
- [ ] PDF file size limit enforced (default 50MB, configurable)
- [ ] Error logging configured (consider Sentry or similar)
- [ ] Performance monitoring enabled (Vercel Analytics or Google Analytics)
- [ ] CSP headers configured to restrict script sources
- [ ] Dependency vulnerabilities resolved (Dependabot clean)
- [ ] Accessibility audit passed (axe-core, manual testing)
- [ ] Chrome testing completed (current + 1 previous major version)
- [ ] Documentation updated (README, quickstart.md)

### Scaling Considerations

For future enhancements if user base grows:
- Add Redis caching for document metadata
- Implement server-side session management for viewer state
- Consider S3/cloud storage instead of file system
- Add authentication/authorization if multi-tenant
- Implement rate limiting on PDF rendering endpoint

---

## Success Metrics

### Development Metrics
- Code coverage: >= 70% (target 80%)
- Build time: < 60 seconds
- Test execution: < 10 seconds (unit/integration), < 5 minutes (E2E)
- PR merge time: < 24 hours (automated gates reduce manual review)

### User Experience Metrics
- Initial page load (LCP): < 2.5s
- Page navigation latency: < 500ms
- Keyboard navigation: 100% of features accessible
- Browser compatibility: 4 browsers × 2 versions = 8 combinations tested

### Quality Metrics
- Zero high/critical security vulnerabilities
- Zero accessibility violations (axe-core)
- 100% of acceptance scenarios passing in E2E tests
- Constitution checklist: All gates PASS

---

## Next Steps

1. ✅ Research complete (`research.md`)
2. ✅ Data model defined (`data-model.md`)
3. ✅ API contracts specified (`contracts/openapi.yaml`)
4. ✅ Quickstart guide written (`quickstart.md`)
5. ✅ Implementation plan complete (`plan.md` - this file)
6. ⏭️ **Run `/speckit.tasks` to generate detailed task breakdown**
7. ⏭️ Begin implementation following TDD workflow
8. ⏭️ Set up CI/CD pipeline in GitHub Actions
9. ⏭️ Iterative development: US-001 → US-003 → US-002

---

**Plan Status**: ✅ COMPLETE (Phase 0 and Phase 1 artifacts delivered)  
**Ready for**: Task generation (`/speckit.tasks` command)  
**Estimated Timeline**: 4-6 weeks for full implementation (1 developer, TDD approach)

---

## Appendix: Language Code Examples

Per IETF BCP 47 standard, language codes follow the format `language-COUNTRY`:

| Code | Language | Country | Example Folder |
|------|----------|---------|----------------|
| `en-US` | English | United States | `contract-2024/en-US/` |
| `en-GB` | English | United Kingdom | `contract-2024/en-GB/` |
| `es-ES` | Spanish | Spain | `contract-2024/es-ES/` |
| `es-MX` | Spanish | Mexico | `contract-2024/es-MX/` |
| `fr-FR` | French | France | `contract-2024/fr-FR/` |
| `fr-CA` | French | Canada | `contract-2024/fr-CA/` |
| `de-DE` | German | Germany | `contract-2024/de-DE/` |
| `ja-JP` | Japanese | Japan | `contract-2024/ja-JP/` |
| `zh-CN` | Chinese | China | `contract-2024/zh-CN/` |
| `zh-TW` | Chinese | Taiwan | `contract-2024/zh-TW/` |

**Raw OCR folders** use the prefix `raw.` (e.g., `raw.en-US/`, `raw.es-ES/`).

**File naming convention**: `<filename>.[raw.]<language-code>_page_<N>.md`
- Example: `contract-2024.en-US_page_1.md`
- Raw: `contract-2024.raw.en-US_page_1.md`
