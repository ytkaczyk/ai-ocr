# Project Guidelines

## Architecture

This monorepo has two main apps:

- `apps/web-viewer/`: Next.js 16 + React 19 app for side-by-side PDF/OCR/translation viewing
- `apps/mistral-ocr/`: Python CLI for OCR, post-processing, and translation with Mistral AI

Respect app boundaries:

- Web UI/API changes should stay in `apps/web-viewer/`
- OCR pipeline changes should stay in `apps/mistral-ocr/`

Use `specs/001-ocr-translation-viewer/` for feature requirements, contracts, and task context.

## Build and Test

Run commands from the app directory you are modifying.

### `apps/web-viewer/`

- Setup: `npm install`
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Type check: `npm run type-check`
- Unit tests: `npm run test`
- E2E tests: `npm run test:e2e`
- E2E debug (single worker + dev server): `npm run test:e2e:single`

### `apps/mistral-ocr/`

- Setup: `uv sync` then copy `.example.env` to `.env`
- Run pipeline: `uv run main.py --input <pdf> --source <lang> --target <lang>`

## Code Style

- Follow existing local patterns before introducing new abstractions.
- Keep changes minimal and focused on the requested task.
- Avoid hardcoded paths or secrets; use environment variables.
- In `apps/web-viewer/`, prefer strict TypeScript patterns already in the codebase.

## Conventions

- Language codes must use IETF BCP 47 format (for example: `en-US`, `es-ES`).
- Data layout must match the viewer contract:
  - PDF in data root
  - sibling folder with language outputs (`raw.<lang>` and `<lang>`)
- For web-viewer API routes, validate environment and inputs before filesystem access.
- Reuse existing custom error classes in `apps/web-viewer/lib/utils/errors.ts`.

## Common Pitfalls

- PDF rendering depends on `public/pdf.worker.mjs` (copied by web-viewer `postinstall`).
- Parallel E2E runs are more stable against production build (`npm run build && npm run start`).
- Invalid language folder names (for example `en` instead of `en-US`) break document discovery.

## Reference Docs

- Web viewer docs: `apps/web-viewer/docs/`
- Web viewer API overview: `apps/web-viewer/docs/api.md`
- Security setup: `apps/web-viewer/docs/security-setup.md`
- OCR CLI usage: `apps/mistral-ocr/README.md`
- Root overview: `README.md`
