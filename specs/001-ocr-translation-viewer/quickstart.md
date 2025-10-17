# Quickstart Guide: OCR Translation Comparison Viewer

**Date**: 2025-10-17  
**Feature**: 001-ocr-translation-viewer  
**Purpose**: Developer onboarding and setup instructions

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20.x or later ([Download](https://nodejs.org/))
- **npm**: Version 10.x or later (comes with Node.js)
- **Git**: For version control ([Download](https://git-scm.com/))
- **Code Editor**: VS Code recommended with extensions:
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
  - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
  - [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ytkaczyk/ai-ocr.git
cd ai-ocr/apps/web-viewer
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages including:
- Next.js 15
- React 18
- TypeScript
- ShadCN UI components
- Vitest for testing
- Tailwind CSS
- Zod for validation

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```bash
# Required: Path to data folder containing document sets
DATA_FOLDER_PATH=/path/to/your/ocr-data

# Optional: Maximum PDF file size in MB (default: 50)
MAX_PDF_SIZE_MB=50

# Optional: Enable debug logging
DEBUG=false

# Next.js public variables (accessible in browser)
NEXT_PUBLIC_PDF_WORKER_SRC=/pdf.worker.js
```

**Important**: The `DATA_FOLDER_PATH` must point to a directory with the following structure:

```
/path/to/your/ocr-data/
├── document-1.pdf
├── document-1/
│   ├── en/
│   │   ├── document-1.en_page_1.md
│   │   ├── document-1.en_page_2.md
│   │   └── ...
│   ├── raw.en/
│   │   └── (raw OCR files)
│   └── es/
│       └── (translated files)
├── document-2.pdf
├── document-2/
│   └── ...
```

### 4. Set Up Test Data (Optional)

For local development, create a test document set:

```bash
npm run setup:test-data
```

This creates a sample document in `./test-data/` with a few pages.

---

## Running the Application

### Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

### Production Build

Build and run the production version:

```bash
npm run build
npm start
```

### Running with Docker (Optional)

```bash
docker build -t ocr-viewer .
docker run -p 3000:3000 -v /path/to/data:/data -e DATA_FOLDER_PATH=/data ocr-viewer
```

---

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode (TDD)

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

Coverage reports are generated in `./coverage/` directory.

**Minimum Coverage Requirements** (Constitution Principle II):
- Overall: 70%
- Critical paths: 90%

### Run E2E Tests

```bash
npm run test:e2e
```

Playwright tests run in headless mode. To debug with UI:

```bash
npm run test:e2e:ui
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format with Prettier
npm run format

# Check formatting
npm run format:check
```

---

## Project Structure

```
apps/web-viewer/
├── app/                       # Next.js App Router
│   ├── api/                   # API routes
│   │   ├── documents/         # Document endpoints
│   │   ├── viewer/            # Viewer state endpoints
│   │   └── ...
│   ├── (viewer)/              # Route group for viewer pages
│   │   ├── page.tsx           # Main viewer page
│   │   └── layout.tsx         # Viewer layout
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── components/                # React components
│   ├── ui/                    # ShadCN components
│   ├── viewer/                # Viewer-specific components
│   │   ├── PdfPane.tsx
│   │   ├── MarkdownPane.tsx
│   │   ├── Pager.tsx
│   │   └── ...
│   └── ...
├── lib/                       # Utilities and shared code
│   ├── api/                   # API client functions
│   ├── schemas/               # Zod validation schemas
│   ├── stores/                # Zustand state management
│   │   ├── useDocumentStore.ts
│   │   └── useViewerStore.ts
│   ├── utils/                 # Helper functions
│   └── ...
├── tests/                     # Test files
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # Playwright E2E tests
├── public/                    # Static assets
│   └── pdf.worker.js          # PDF.js worker
├── specs/                     # Feature specifications (symlink)
├── .env.example               # Example environment variables
├── .env.local                 # Local environment (gitignored)
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── vitest.config.ts           # Vitest configuration
├── playwright.config.ts       # Playwright configuration
└── README.md                  # Project overview
```

---

## Key Technologies

| Technology | Purpose | Documentation |
|------------|---------|---------------|
| **Next.js 15** | React framework with SSR | [nextjs.org](https://nextjs.org) |
| **ShadCN UI** | Accessible component library | [ui.shadcn.com](https://ui.shadcn.com) |
| **Tailwind CSS** | Utility-first CSS framework | [tailwindcss.com](https://tailwindcss.com) |
| **Vitest** | Fast unit test runner | [vitest.dev](https://vitest.dev) |
| **Playwright** | E2E browser testing | [playwright.dev](https://playwright.dev) |
| **React-PDF** | PDF rendering in React | [react-pdf](https://www.npmjs.com/package/react-pdf) |
| **react-markdown** | Markdown rendering | [remarkjs](https://github.com/remarkjs/react-markdown) |
| **Zustand** | State management | [zustand](https://github.com/pmndrs/zustand) |
| **Zod** | Runtime validation | [zod.dev](https://zod.dev) |

---

## Development Workflow (TDD)

This project follows **Test-Driven Development** principles:

### 1. Write Test First

```typescript
// tests/unit/components/Pager.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Pager } from '@/components/viewer/Pager';

describe('Pager', () => {
  it('disables previous button on first page', () => {
    render(<Pager currentPage={1} totalPages={10} onPageChange={() => {}} />);
    const prevButton = screen.getByRole('button', { name: /previous/i });
    expect(prevButton).toBeDisabled();
  });
});
```

### 2. Run Test (Should Fail)

```bash
npm run test:watch
```

### 3. Write Minimal Implementation

```typescript
// components/viewer/Pager.tsx
export function Pager({ currentPage, totalPages, onPageChange }) {
  return (
    <div>
      <button disabled={currentPage === 1}>Previous</button>
      <span>{currentPage} / {totalPages}</span>
      <button disabled={currentPage === totalPages}>Next</button>
    </div>
  );
}
```

### 4. Test Passes → Refactor

Improve implementation while keeping tests green.

### 5. Commit

```bash
git add .
git commit -m "feat: add Pager component with navigation controls"
```

---

## Common Tasks

### Add a New ShadCN Component

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add select
npx shadcn-ui@latest add card
```

Components are copied to `components/ui/`.

### Create a New API Route

```bash
# Create file: app/api/my-route/route.ts
export async function GET(request: Request) {
  return Response.json({ message: 'Hello' });
}
```

### Add a New Zustand Store

```typescript
// lib/stores/useMyStore.ts
import { create } from 'zustand';

interface MyState {
  count: number;
  increment: () => void;
}

export const useMyStore = create<MyState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### Generate TypeScript Types from OpenAPI

```bash
npm run generate:types
```

This reads `specs/001-ocr-translation-viewer/contracts/openapi.yaml` and generates types in `lib/types/api.ts`.

---

## Troubleshooting

### Issue: PDF Worker Not Found

**Error**: `Cannot find PDF.js worker`

**Solution**: Ensure `public/pdf.worker.js` exists:

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/pdf.worker.js
```

### Issue: Data Folder Not Found

**Error**: `ENOENT: no such file or directory`

**Solution**: Check `DATA_FOLDER_PATH` in `.env.local` points to existing directory with read permissions.

### Issue: Tests Failing with Import Errors

**Error**: `Cannot use import statement outside a module`

**Solution**: Ensure `vitest.config.ts` has correct settings:

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

### Issue: Port 3000 Already in Use

**Solution**: Kill process or use different port:

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

---

## Contributing

### Before Submitting PR

1. ✅ All tests pass: `npm test`
2. ✅ Linting passes: `npm run lint`
3. ✅ Coverage >= 70%: `npm run test:coverage`
4. ✅ E2E tests pass: `npm run test:e2e`
5. ✅ Constitution check completed (see PR template)

### PR Template

When creating a PR, include:

- Link to feature spec
- Summary of changes
- Testing notes (how to test manually)
- Constitution checklist:
  - [ ] Code Quality: ESLint passes, documented
  - [ ] Tests: Coverage >= 70%, TDD followed
  - [ ] UX: Accessible, keyboard navigable
  - [ ] Security: No secrets committed, inputs validated
  - [ ] Performance: Benchmarks included if applicable

---

## CI/CD Pipeline

GitHub Actions automatically runs on every push and PR:

1. **Lint Job**: ESLint validation
2. **Test Job**: Unit + integration tests with coverage report
3. **Build Job**: Production build verification
4. **E2E Job**: Playwright tests in browsers

**Status Badge**: ![CI Status](https://github.com/ytkaczyk/ai-ocr/actions/workflows/ci.yml/badge.svg)

---

## Useful Commands Cheat Sheet

```bash
# Development
npm run dev                  # Start dev server
npm run build                # Production build
npm start                    # Run production server

# Testing
npm test                     # Run all tests once
npm run test:watch           # TDD mode (watch)
npm run test:coverage        # Coverage report
npm run test:e2e             # E2E tests
npm run test:e2e:ui          # E2E with Playwright UI

# Code Quality
npm run lint                 # Check linting
npm run lint:fix             # Auto-fix linting issues
npm run format               # Format with Prettier
npm run type-check           # TypeScript type checking

# Utilities
npm run generate:types       # Generate types from OpenAPI
npm run setup:test-data      # Create test document set
npm run clean                # Clean build artifacts
```

---

## Next Steps

1. ✅ Complete setup following this guide
2. ⏭️ Read `specs/001-ocr-translation-viewer/spec.md` for feature requirements
3. ⏭️ Review `specs/001-ocr-translation-viewer/plan.md` for implementation plan
4. ⏭️ Explore codebase starting with `app/(viewer)/page.tsx`
5. ⏭️ Run tests to understand expected behavior
6. ⏭️ Start contributing!

---

## Support

- **Documentation**: See `specs/001-ocr-translation-viewer/` directory
- **Issues**: Create GitHub issue with `[web-viewer]` label
- **Questions**: Ask in team Slack channel `#ai-ocr-dev`

---

**Last Updated**: 2025-10-17  
**Maintainers**: AI-OCR Team
