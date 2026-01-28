# OCR Translation Comparison Viewer

A Next.js web application for comparing original PDF documents with their OCR-extracted and translated markdown outputs side-by-side.

## Features

- **Multi-Pane Viewing**: Compare documents in 2-pane (PDF + OCR) or 3-pane (PDF + OCR + Translation) modes
- **Synchronized Navigation**: All panes stay in sync as you navigate through pages
- **Language Support**: View multiple language versions with per-pane language selection
- **Keyboard Navigation**: Full keyboard support with arrow keys, Page Up/Down
- **Responsive Design**: Optimized for desktop (768px+) with tablet/mobile warnings
- **Accessibility**: WCAG 2.1 AA compliant with screen reader support
- **Performance**: Supports documents up to 200 pages with progressive loading

## Quick Start

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later

### Installation

#### Option 1: Dev Container (Recommended)

The easiest way to get started with a fully configured environment:

1. **Prerequisites**:
   - [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
   - [VS Code](https://code.visualstudio.com/) with [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. **Clone and open**:

   ```bash
   git clone https://github.com/ytkaczyk/ai-ocr.git
   cd ai-ocr
   code .
   ```

3. **Start dev container**:
   - VS Code will prompt to "Reopen in Container"
   - Or press `F1` → "Dev Containers: Reopen in Container"
   - Wait for container to build (5-10 minutes first time)

4. **Configure and run**:
   ```bash
   cd apps/web-viewer
   cp .env.example .env.local
   # Edit .env.local with your data folder path
   npm run dev
   ```

See [.devcontainer/web-viewer/README.md](../../.devcontainer/web-viewer/README.md) for full documentation.

#### Option 2: Local Installation

1. Clone the repository:

```bash
git clone https://github.com/ytkaczyk/ai-ocr.git
cd ai-ocr/apps/web-viewer
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your data folder path:

```bash
DATA_FOLDER_PATH=/path/to/your/ocr-data
MAX_PDF_SIZE_MB=50
MEMORY_LIMIT_MB=500
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Data Folder Structure

Documents must follow this structure:

```
data/
├── document-name.pdf
├── document-name/
│   ├── en-US/                                    # Processed OCR
│   │   ├── document-name.en-US_page_1.md
│   │   ├── document-name.en-US_page_2.md
│   │   └── ...
│   ├── raw.en-US/                                # Raw OCR (optional)
│   │   └── document-name.raw.en-US_page_1.md
│   └── es-ES/                                    # Translation (optional)
│       └── document-name.es-ES_page_1.md
```

**Requirements:**

- Language codes must follow IETF BCP 47 format (e.g., `en-US`, `es-ES`, `fr-CA`)
- Each page must have a corresponding markdown file
- Processed content preferred over raw (use `processed/` prefix or no prefix)
- Images in markdown should use relative paths from the data folder

## Usage

### Document Selection

1. Select a document from the list on the home page
2. Click to load the document in 2-pane mode (PDF + OCR)

### Navigation

- **Next/Previous Page**: Click buttons or use arrow keys (←/→)
- **Jump to Page**: Click page number input and type page number
- **First/Last Page**: Click first/last buttons or use Home/End keys
- **Keyboard Shortcuts**:
  - `←/→` or `Page Up/Down`: Navigate pages
  - `Home/End`: Jump to first/last page
  - `Tab`: Cycle through controls

### Mode Switching

- **2-Pane Mode**: View PDF + OCR side-by-side
- **3-Pane Mode**: View PDF + OCR + Translation (requires translation data)
- Click mode toggle button or use `Ctrl+M` (Windows) / `Cmd+M` (Mac)

### Language Selection

- Click language dropdown in each markdown pane header
- Select language version (e.g., English, Spanish, French)
- Toggle between processed and raw OCR output

### Pane Resizing

- Drag divider between panes to adjust widths
- Each pane supports 20%-80% width range
- Double-click divider to reset to equal widths

### Zoom Controls (PDF Only)

- **Zoom In/Out**: Click +/- buttons or use `Ctrl +/-`
- **Zoom Presets**: Select from dropdown (50%, 75%, 100%, etc.)
- **Fit Page**: Scale to fit entire page in view
- **Fit Width**: Scale to fit page width

## Development

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.3+
- **UI Library**: React 19 + ShadCN UI + Tailwind CSS
- **State Management**: Zustand
- **PDF Rendering**: React-PDF (PDF.js)
- **Markdown Rendering**: react-markdown + remark-gfm
- **Validation**: Zod
- **Testing**: Vitest + React Testing Library + Playwright

### Available Scripts

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Build production bundle
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # Run TypeScript compiler checks
npm run test         # Run unit/integration tests (Vitest)
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Open Vitest UI
npm run test:coverage # Generate coverage report
npm run test:e2e     # Run E2E tests (4 workers, production build)
npm run test:e2e:single # Run E2E tests (1 worker, dev server)
npm run test:e2e:ui  # Open Playwright UI
npm run test:debug   # Debug tests with Node inspector
```

### Project Structure

```
apps/web-viewer/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   └── documents/        # Document endpoints
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page (document selector)
├── components/               # React components
│   ├── ui/                   # ShadCN UI primitives
│   └── viewer/               # Viewer-specific components
│       ├── DocumentCard.tsx
│       ├── DocumentSelector.tsx
│       ├── EmptyState.tsx
│       ├── LanguageSelector.tsx
│       ├── MarkdownPane.tsx
│       ├── ModeToggle.tsx
│       ├── Pager.tsx
│       ├── PaneContainer.tsx
│       ├── PdfPane.tsx
│       ├── Viewer.tsx
│       ├── ViewportWarning.tsx
│       └── ZoomControls.tsx
├── lib/                      # Utilities and business logic
│   ├── api/                  # API client functions
│   ├── schemas/              # Zod validation schemas
│   ├── stores/               # Zustand state stores
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── tests/                    # Test files
│   ├── e2e/                  # Playwright E2E tests
│   ├── integration/          # Integration tests
│   └── unit/                 # Unit tests
├── public/                   # Static assets
│   └── pdf.worker.mjs        # PDF.js worker
├── docs/                     # Documentation
│   ├── api.md                # API documentation
│   ├── deployment.md         # Deployment guide
│   └── browser-compatibility.md
├── .env.example              # Environment variables template
├── next.config.mjs           # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── vitest.config.ts          # Vitest configuration
└── playwright.config.ts      # Playwright configuration
```

### Testing

Run the full test suite:

```bash
npm test                 # Unit/integration tests
npm run test:e2e         # E2E tests (parallel, production build)
npm run test:e2e:single  # E2E tests (single worker, dev server, for debugging)
npm run test:coverage    # With coverage report
```

**Test Coverage Goals:**

- API routes: 90%
- Viewer components: 80%
- Utility functions: 70%
- UI components: 60%

**Current Status:**

- 375+ unit tests passing
- 179 E2E tests (100% pass rate)
- All tests run in Chrome (Chromium)

### Code Quality

The project enforces code quality through:

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb config with Next.js rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks (lint + type-check)
- **GitHub Actions**: CI pipeline with automated checks

### Contributing

1. Create a feature branch from `main`
2. Follow TDD workflow: Write test → Implement → Refactor
3. Ensure all tests pass: `npm test && npm run test:e2e`
4. Run linting: `npm run lint:fix`
5. Submit pull request with description

## Browser Support

- **Supported**: Chrome/Chromium only (current + 1 previous major version)
- **Testing**: All tests run in Chromium via Playwright
- **Not Supported**: Firefox, Safari, Edge (may work but not tested)
- **Mobile**: Not optimized (shows viewport warning)

**Note**: The application is developed and tested exclusively in Chrome/Chromium. Other browsers may work but are not officially supported or tested.

See [docs/browser-compatibility.md](./docs/browser-compatibility.md) for details.

## Performance

- **Document Load**: < 5 seconds (LCP)
- **Page Navigation**: < 500ms
- **Supported Document Size**: Up to 200 pages
- **PDF Size Limit**: 50MB (configurable)
- **Memory Limit**: 500MB (configurable)

Performance is monitored via:

- Lighthouse CI (LCP threshold)
- Memory pressure detection
- Navigation timing metrics

## Accessibility

WCAG 2.1 AA compliant with:

- Keyboard navigation (no mouse required)
- Screen reader support (ARIA labels, live regions)
- Focus indicators on all interactive elements
- Color contrast >= 4.5:1
- Semantic HTML with proper landmarks

Tested with:

- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS)
- axe-core (automated)

## Security

Security features:

- Path traversal prevention (server-side validation)
- Filename validation (alphanumeric + hyphens/underscores only)
- Symlink rejection
- Input sanitization (language codes, page numbers)
- Content Security Policy (CSP) headers
- No path disclosure in error messages

See [docs/security-requirements-verification.md](../../../specs/001-ocr-translation-viewer/docs/security-requirements-verification.md) for audit results.

## Deployment

See [docs/deployment.md](./docs/deployment.md) for deployment instructions.

## Troubleshooting

### Common Issues

**Issue**: Document list is empty

- **Solution**: Check `DATA_FOLDER_PATH` in `.env.local` points to valid directory with `.pdf` files

**Issue**: PDF not rendering

- **Solution**: Verify PDF size < `MAX_PDF_SIZE_MB` limit, check browser console for errors

**Issue**: Markdown images not loading

- **Solution**: Ensure image paths in markdown are relative to data folder

**Issue**: Page navigation slow

- **Solution**: Check document size (< 200 pages recommended), reduce PDF quality in settings

**Issue**: Tests failing in CI

- **Solution**: Verify test data fixtures exist, check Playwright browser installation

## License

See [LICENSE.txt](../../LICENSE.txt) for details.

## Links

- **Specification**: [specs/001-ocr-translation-viewer/spec.md](../../specs/001-ocr-translation-viewer/spec.md)
- **Implementation Plan**: [specs/001-ocr-translation-viewer/plan.md](../../specs/001-ocr-translation-viewer/plan.md)
- **API Documentation**: [docs/api.md](./docs/api.md)
- **Deployment Guide**: [docs/deployment.md](./docs/deployment.md)
- **Browser Compatibility**: [docs/browser-compatibility.md](./docs/browser-compatibility.md)

## Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review [specification](../../specs/001-ocr-translation-viewer/spec.md)
3. Search existing GitHub issues
4. Create new issue with reproduction steps
