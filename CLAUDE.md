# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a loose monorepo — no shared packages, no Turborepo. Two independent apps communicate only through a shared filesystem data folder.

- `apps/web-viewer/` — Next.js 16 + React 19 viewer for side-by-side PDF/OCR/translation comparison
- `apps/mistral-ocr/` — Python 3.13 CLI that runs OCR, post-processing, and translation via Mistral AI
- `specs/001-ocr-translation-viewer/` — Feature spec, contracts (OpenAPI), tasks, and plan

Run all commands from the relevant app directory.

## Commands

### apps/web-viewer/

```bash
npm install          # Setup (also copies pdf.worker.mjs via postinstall)
npm run dev          # Dev server on port 3000 (Turbopack)
npm run build        # Production build
npm run lint         # ESLint — zero warnings allowed
npm run type-check   # TypeScript (no emit)
npm run test         # Vitest unit + integration tests
npm run test:watch   # Vitest watch mode
npm run test:coverage # Vitest with V8 coverage (70% lines required)
npm run test:e2e     # Playwright E2E against production build (workers per Playwright config: 4 local, 1 in CI)
npm run test:e2e:single  # Playwright E2E with dev server, single worker (for debugging)
```

### apps/mistral-ocr/

```bash
uv sync
cp .example.env .env   # Add MISTRAL_API_KEY
uv run main.py --input <pdf> --source <lang> --target <lang>
```

No lint, type-check, or tests for the Python app.

## Architecture

### Inter-App Communication

The two apps are **decoupled entirely through the filesystem**. `mistral-ocr` writes outputs; `web-viewer` reads them. No HTTP calls, no shared code.

Required data layout (controlled by `DATA_FOLDER_PATH` in web-viewer):

```
<DATA_FOLDER_PATH>/
└── document.pdf                                 # Original PDF (filename = document ID)
└── document/                                    # Sibling folder, same base name
    ├── en-US/
    │   └── document.en-US_page_N.md             # Processed OCR/translation per page
    ├── raw.en-US/
    │   └── document.raw.en-US_page_N.md         # Raw OCR output per page
    └── es-ES/
        └── document.es-ES_page_N.md
```

Language codes must be IETF BCP 47 (e.g. `en-US`, `es-ES`). Using `en` instead of `en-US` breaks document discovery.

### web-viewer Internal Architecture

- **API routes** (`app/api/`) read from `DATA_FOLDER_PATH` and serve documents, pages, images, and PDFs
- **Zod schemas** (`lib/schemas/`) validate API request/response shapes at runtime where applicable
- **Zustand stores** (`lib/stores/`): `useViewerStore` manages pane config, page navigation, zoom, and mode switching; `useDocumentStore` manages the document list and selection
- **PDF rendering** is entirely client-side via React-PDF/PDF.js; the server only serves the raw binary at `/api/documents/[id]/pdf`. Worker file must exist at `public/pdf.worker.mjs` (copied by `postinstall`)
- **Security** (`lib/utils/security.ts`): all API inputs are validated with strict regex before filesystem access; path traversal is prevented using `path.resolve` + `startsWith`
- **Error handling**: reuse custom classes from `lib/utils/errors.ts` (`AppError`, `ValidationError`, `NotFoundError`, `FileSystemError`, etc.) — do not throw plain errors in API routes
- **Env config**: `lib/utils/env.ts` exports a Zod-validated config object; never read `process.env` directly in app code

### web-viewer Environment Variables

```
DATA_FOLDER_PATH=/path/to/ocr-data   # Required
MAX_PDF_SIZE_MB=50                    # Optional, default 50
MEMORY_LIMIT_MB=500                   # Optional, default 500
```

### mistral-ocr Pipeline

`main.py` currently runs three sequential steps with smart caching (skips completed steps unless forced):

1. **OCR**: PDF → `raw.<source>/` (JSON + per-page MD + images)
2. **Post-process source OCR**: `raw.<source>/` → `<source>/` (LLM markdown cleanup)
3. **Translate**: `<source>/` → `raw.<target>/` (LLM translation; outputs are written to `raw.<target>/`)

Override flags: `--force_ocr`, `--force_ocr_post_process`, `--force_translate`, `--limit_to_pages`.

## Key Conventions

- Keep web-viewer changes in `apps/web-viewer/` and OCR changes in `apps/mistral-ocr/`
- In API routes, always validate env and inputs before any filesystem access
- Use existing Zod schemas; add new ones in `lib/schemas/` following the existing pattern
- Parallel E2E tests are more stable against a production build (`npm run build && npm run start`) than the dev server
- CI requires ESLint zero warnings, TypeScript clean compile, Vitest ≥70% line coverage, and all E2E tests passing

## Reference Docs

- `apps/web-viewer/docs/` — API reference, security setup, deployment, browser compatibility
- `specs/001-ocr-translation-viewer/contracts/openapi.yaml` — API contract
