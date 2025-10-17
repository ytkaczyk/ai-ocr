# Research: OCR Translation Comparison Viewer

**Date**: 2025-10-17  
**Feature**: 001-ocr-translation-viewer  
**Purpose**: Resolve technical unknowns and establish technology choices

## Executive Summary

This research document resolves all NEEDS CLARIFICATION items from the Technical Context and establishes the technology stack for the OCR Translation Comparison Viewer web application.

**Key Decisions**:
- Next.js 15 (App Router) for full-stack React framework
- ShadCN UI + Tailwind CSS for component library
- Vitest + React Testing Library for test-driven development
- GitHub Actions for CI/CD
- React-PDF for client-side PDF rendering
- Server Actions for API layer (Next.js native)

---

## 1. Framework Selection: Next.js 15

### Decision
Use **Next.js 15** with the App Router pattern for the web application.

### Rationale
- **Server-side rendering**: Spec requires server-side processing for PDF rendering and markdown parsing; Next.js Server Components and Server Actions provide native support
- **File-based routing**: Simplified structure for main viewer page and document selection
- **Performance**: Built-in optimization for images, fonts, and code splitting
- **Active ecosystem**: Large community, extensive documentation, frequent updates
- **TypeScript native**: First-class TypeScript support matches best practices
- **API Routes/Server Actions**: Eliminates need for separate backend API server

### Alternatives Considered
- **Vite + React SPA**: Rejected because server-side processing requirement makes pure SPA insufficient; would need separate backend
- **Remix**: Rejected due to smaller ecosystem and less mature tooling compared to Next.js
- **Create React App**: Deprecated and no longer maintained

### Implementation Notes
- Use App Router (`app/` directory) not Pages Router
- Server Components for data loading
- Server Actions for mutations (document loading, page navigation state)
- Client Components only where interactivity required (pager, pane controls)

---

## 2. UI Component Library: ShadCN

### Decision
Use **ShadCN** (shadcn/ui) with Tailwind CSS for UI components.

### Rationale
- **Copy-paste, not NPM dependency**: Components are copied into project, allowing full customization and avoiding version conflicts
- **Accessibility first**: Built on Radix UI primitives with ARIA attributes (satisfies Constitution Principle III)
- **Tailwind native**: Consistent with modern React ecosystem and rapid styling
- **TypeScript typed**: Full type safety for component props
- **Design tokens**: Easy theme customization via CSS variables

### Alternatives Considered
- **Material-UI (MUI)**: Rejected due to heavy bundle size and opinionated design that's harder to customize
- **Chakra UI**: Rejected because runtime CSS-in-JS impacts performance vs. Tailwind's compile-time approach
- **Headless UI**: Rejected because ShadCN provides higher-level components built on Radix (more productive)

### Implementation Notes
- Initialize with `npx shadcn-ui@latest init`
- Install components individually as needed: Button, Slider, Tabs, Select, Card
- Use design tokens from `tailwind.config.ts` for theme consistency
- Pager control: Custom component using ShadCN Button + Input

---

## 3. Testing Framework: Vitest + React Testing Library

### Decision
Use **Vitest** as test runner with **React Testing Library** for component tests and **Playwright** for E2E tests.

### Rationale
- **TDD Support**: Fast test execution (~10x faster than Jest) enables true test-first development
- **Vite-native**: Shares config with Next.js build tooling, reducing configuration complexity
- **ESM-first**: Native ES modules support avoids Jest transform issues
- **React Testing Library**: User-centric testing approach (queries by role, label) aligns with accessibility goals
- **Playwright for E2E**: Browser automation for multi-pane synchronization testing

### Alternatives Considered
- **Jest**: Rejected due to slower execution and ESM configuration complexity
- **Cypress**: Rejected in favor of Playwright which has better TypeScript support and modern async/await API

### Implementation Notes
- Vitest config in `vitest.config.ts` with jsdom environment
- Test file convention: `*.test.ts` or `*.test.tsx`
- Coverage target: 70% minimum per Constitution Principle II
- E2E tests in `tests/e2e/` using Playwright
- GitHub Actions runs all tests on PR

---

## 4. PDF Rendering: React-PDF

### Decision
Use **React-PDF** (client-side) for PDF page rendering in the browser.

### Rationale
- **PDF.js integration**: Built on Mozilla's PDF.js, mature and widely used
- **React component API**: Clean integration with React component tree
- **Canvas rendering**: Efficient page-by-page rendering without loading entire PDF
- **Text layer support**: Enables search and text selection if needed in future
- **Worker support**: Offloads PDF parsing to Web Worker for main thread performance

### Alternatives Considered
- **PDF.js directly**: Rejected because React-PDF provides cleaner React API
- **Server-side rendering to images**: Rejected due to latency and storage costs for pre-rendering all pages
- **IFrame embed**: Rejected because limited control over page synchronization and navigation

### Implementation Notes
- Install: `npm install react-pdf pdfjs-dist`
- Configure worker: `pdfjs.GlobalWorkerOptions.workerSrc`
- Load PDF from server-side data folder via API route
- Render single page at a time based on pager state
- Implement loading states and error boundaries for failed renders

---

## 5. Markdown Rendering: react-markdown

### Decision
Use **react-markdown** with **remark-gfm** plugin for markdown content display.

### Rationale
- **Security**: Does not use `dangerouslySetInnerHTML`, safe by default
- **Extensible**: Plugin system for GitHub Flavored Markdown (tables, strikethrough)
- **React native**: Returns React components, not raw HTML
- **Syntax highlighting**: Can add `react-syntax-highlighter` for code blocks if needed

### Alternatives Considered
- **marked + DOMPurify**: Rejected because react-markdown is safer and more React-idiomatic
- **MDX**: Rejected as overkill (markdown content is data, not code)

### Implementation Notes
- Install: `npm install react-markdown remark-gfm`
- Custom components for images to resolve from data folder
- Handle images in markdown: load from `<file_name>/[raw.]<language_code>/` directory

---

## 6. State Management: Zustand

### Decision
Use **Zustand** for client-side global state (current page, pane mode, selected document).

### Rationale
- **Minimal boilerplate**: Simpler than Redux, less verbose than Context API
- **DevTools support**: Redux DevTools integration for debugging
- **TypeScript**: Full type inference for stores
- **Small bundle**: <1KB gzipped
- **Server Component compatible**: Can hydrate from server state

### Alternatives Considered
- **React Context**: Rejected because causes re-renders of entire tree unless carefully memoized
- **Redux Toolkit**: Rejected as too complex for this application's state needs
- **Jotai/Recoil**: Rejected because Zustand has larger ecosystem and simpler mental model

### Implementation Notes
- Create stores: `useDocumentStore` (selected document, available documents), `useViewerStore` (page number, pane mode)
- Persist page state in URL query params for bookmarking
- Use middleware for local storage persistence of preferences

---

## 7. GitHub Actions CI/CD

### Decision
Implement **GitHub Actions** workflow with test, lint, and build jobs.

### Rationale
- **Native GitHub integration**: Built into repository, no external service needed
- **Free for public repos**: Aligned with OSS best practices
- **Matrix builds**: Can test across Node versions if needed
- **Artifact storage**: Store build outputs and test reports
- **GitHub summary**: Test results visible in PR UI

### Workflow Jobs
```yaml
name: CI

on: [push, pull_request]

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
```

### Implementation Notes
- Fail fast on lint errors
- Block merge if tests fail or coverage < 70%
- Cache `node_modules` for faster builds
- Run E2E tests in separate job with browser matrix

---

## 8. Environment Configuration: .env

### Decision
Use **Next.js native .env support** with the following variables:

```bash
# Data folder configuration
DATA_FOLDER_PATH=/path/to/ocr-data

# PDF processing
MAX_PDF_SIZE_MB=50

# Performance
NEXT_PUBLIC_PDF_WORKER_SRC=/pdf.worker.js
```

### Rationale
- **Next.js built-in**: No additional library needed
- **NEXT_PUBLIC_ prefix**: Client-side variables clearly marked
- **Type safety**: Can generate types with `t3-env` library
- **Validation**: Use `zod` to validate env vars at startup

### Implementation Notes
- `.env.local` for local development (gitignored)
- `.env.example` committed to repo with placeholder values
- Server-side validation on startup, fail fast if misconfigured
- Document all variables in quickstart.md

---

## 9. Performance Optimization

### Decision
Target performance goals from spec:
- Document load < 5 seconds
- Page navigation < 500ms
- Support 200+ page documents

### Strategies
1. **Lazy loading**: Only render current page PDF + markdown
2. **Prefetch adjacent pages**: Load N-1 and N+1 in background
3. **PDF worker**: Offload parsing to Web Worker
4. **Image optimization**: Use Next.js `<Image>` component for markdown images
5. **Code splitting**: Dynamic imports for PDF/markdown renderers
6. **Memoization**: `React.memo` for Pane components

### Implementation Notes
- Use React Suspense for loading states
- Implement virtual scrolling if panes have long content
- Monitor Core Web Vitals with Vercel Analytics

---

## 10. Accessibility

### Decision
Meet WCAG 2.1 AA standards (Constitution Principle III).

### Implementation Checklist
- ✅ Keyboard navigation: Arrow keys, Page Up/Down for pager
- ✅ Screen reader: ARIA labels on all interactive elements
- ✅ Focus management: Visible focus indicators on all controls
- ✅ Color contrast: 4.5:1 minimum (ShadCN default theme complies)
- ✅ Semantic HTML: Proper heading hierarchy, landmarks

### Testing
- Manual keyboard navigation testing
- Screen reader testing (NVDA/JAWS on Windows, VoiceOver on macOS)
- Automated: `axe-core` via Playwright

---

## Summary Table

| Category | Technology | Rationale |
|----------|------------|-----------|
| Framework | Next.js 15 (App Router) | Server-side processing, performance, ecosystem |
| UI Library | ShadCN + Tailwind CSS | Accessibility, customization, modern patterns |
| Testing | Vitest + React Testing Library + Playwright | Fast TDD, user-centric, E2E coverage |
| PDF Rendering | React-PDF | Mature, React-native, worker support |
| Markdown | react-markdown + remark-gfm | Secure, extensible, GFM support |
| State Management | Zustand | Simple, TypeScript, small bundle |
| CI/CD | GitHub Actions | Native, free, comprehensive |
| Environment | .env + zod | Type-safe, validated, Next.js native |

---

## Next Steps

1. ✅ Research complete
2. ⏭️ Create `data-model.md` with entities and relationships
3. ⏭️ Generate API contracts in `/contracts/`
4. ⏭️ Write `quickstart.md` for developer onboarding
5. ⏭️ Update agent context with technology choices
6. ⏭️ Begin Phase 2 planning in `plan.md`
