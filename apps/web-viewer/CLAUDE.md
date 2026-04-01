# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run all commands from `apps/web-viewer/`.

```bash
npm install          # Setup (also copies pdf.worker.mjs via postinstall)
npm run dev          # Dev server on port 3000 (Turbopack)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint — zero warnings allowed
npm run lint:fix     # Auto-fix ESLint issues
npm run type-check   # TypeScript (no emit)
npm run test         # Vitest unit + integration tests
npm run test:watch   # Vitest watch mode
npm run test:coverage # Vitest with V8 coverage (70% lines required)
npm run test:e2e     # Playwright E2E against production build (4 workers)
npm run test:e2e:single  # Playwright E2E with dev server, 1 worker (for debugging)
```

Run a single Vitest test file:
```bash
npx vitest run tests/unit/utils/security.test.ts
```

Run a single Playwright spec:
```bash
npx playwright test tests/e2e/viewer-navigation.spec.ts --reporter=list
```

## Architecture

### Data Flow

API routes in `app/api/` read markdown and PDF files from the filesystem path set by `DATA_FOLDER_PATH`. They serve data to the React frontend. There are no external services or databases.

Required data layout:
```
<DATA_FOLDER_PATH>/
└── document.pdf
└── document/
    ├── en-US/          # processed OCR: document.en-US_page_N.md
    ├── raw.en-US/      # raw OCR:       document.raw.en-US_page_N.md
    └── es-ES/          # translation:   document.es-ES_page_N.md
```

Language codes must be IETF BCP 47 (e.g. `en-US`, `es-ES`). Using plain `en` breaks document discovery.

### State Management (Zustand)

Two stores in `lib/stores/`:

- **`useDocumentStore`** — document list, current document selection
- **`useViewerStore`** — pane configuration, page navigation (synchronized across all panes), zoom, 2-pane vs 3-pane mode switching with rollback

Mode switching supports rollback: `setPaneModeWithRollback` saves previous state and calls `rollbackModeSwitch` on failure.

### API Routes (`app/api/`)

All routes follow the same pattern:
1. Call `validateEnv()` from `lib/utils/env.ts` — never read `process.env` directly
2. Validate path parameters using `validateFilename` / `validateLanguageCode` from `lib/utils/security.ts`
3. Access filesystem only after validation
4. Throw custom error classes from `lib/utils/errors.ts`; never throw plain `Error`

Error classes: `AppError`, `ValidationError`, `NotFoundError`, `FileSystemError`, `PdfProcessingError`, `ConfigurationError`, `PayloadTooLargeError`. Use `toErrorResponse` and `getStatusCode` when building `NextResponse` error payloads.

### Zod Schemas (`lib/schemas/`)

All API request/response shapes are validated at runtime with Zod. Add new schemas in `lib/schemas/` following the existing pattern; export both the schema and the inferred TypeScript type.

### PDF Rendering

PDF rendering is entirely client-side via `react-pdf` / PDF.js. The server only streams the raw binary at `/api/documents/[id]/pdf`. The PDF.js worker must exist at `public/pdf.worker.mjs`; it is copied there by the `postinstall` script.

### Security (`lib/utils/security.ts`)

Path traversal is prevented by: strict regex on all user-supplied path segments → `path.resolve` + `startsWith(dataFolder)` check before any `fs` call. Never bypass these checks.

## Environment Variables

```
DATA_FOLDER_PATH=/path/to/ocr-data   # Required
MAX_PDF_SIZE_MB=50                    # Optional, default 50
MEMORY_LIMIT_MB=500                   # Optional, default 500
```

Configure via `.env.local` (copy from `.env.example`).

## Testing Notes

- Vitest and Playwright are separate runners. Vitest excludes `tests/e2e/`; Playwright runs only that folder.
- E2E tests are most stable against a production build (`npm run build && npm run start`). Use `test:e2e:single` with the dev server only for debugging.
- CI enforces: zero ESLint warnings, clean TypeScript compile, Vitest ≥70% line coverage, all E2E passing.
- Test fixtures live in `data/` (e.g. `data/kombucha/`). Integration tests use `DATA_FOLDER_PATH` pointed at this folder.

## Browser Support

Chrome/Chromium only. All E2E tests run in Chromium via Playwright.
