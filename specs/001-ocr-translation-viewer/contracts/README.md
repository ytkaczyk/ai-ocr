# API Contracts: OCR Translation Comparison Viewer

**Date**: 2025-10-17  
**Feature**: 001-ocr-translation-viewer  
**Purpose**: Define REST API endpoints and data contracts

## Overview

This document describes the API contracts for the OCR Translation Comparison Viewer. The API follows REST principles and is implemented using Next.js API Routes (or Server Actions where appropriate).

See `openapi.yaml` for the complete OpenAPI 3.1 specification.

---

## Endpoint Summary

| Endpoint | Method | Purpose | Source Requirements |
|----------|--------|---------|---------------------|
| `/api/documents` | GET | List all document sets | FR-007 |
| `/api/documents/{id}` | GET | Get document details | FR-007, FR-011 |
| `/api/documents/{id}/validate` | POST | Validate structure | FR-011, FR-014 |
| `/api/documents/{id}/pages/{n}/pdf` | GET | Render PDF page | FR-001, FR-020 |
| `/api/documents/{id}/pages/{n}/markdown` | GET | Get markdown content | FR-002, FR-009, FR-021 |
| `/api/documents/{id}/images/{lang}/{path}` | GET | Get markdown image | FR-010 |
| `/api/viewer/state` | GET | Get viewer state | FR-003, FR-004 |
| `/api/viewer/state` | POST | Update viewer state | FR-003, FR-004, FR-006 |

---

## Design Decisions

### 1. REST vs GraphQL
**Decision**: Use REST API  
**Rationale**: Simpler for this use case; predictable caching; no over-fetching concerns with small payloads

### 2. Server Actions vs API Routes
**Decision**: Use API Routes for data fetching, Server Actions for mutations  
**Rationale**: API Routes better for caching and external access; Server Actions for form submissions

### 3. PDF Rendering Strategy
**Decision**: Server-side render to base64 PNG data URL  
**Rationale**: Avoids client-side PDF.js complexity; easier to cache; consistent rendering

### 4. Image Serving
**Decision**: Dedicated image endpoint with path parameter  
**Rationale**: Enables browser caching; supports Next.js Image optimization

### 5. Error Codes
**Decision**: Use semantic error codes (e.g., `DOCUMENT_NOT_FOUND`)  
**Rationale**: Client can handle errors programmatically; better than HTTP codes alone

---

## Implementation Notes

### Validation with Zod

All request/response bodies validated using Zod schemas:

```typescript
import { z } from 'zod';

// Request validation
export const DocumentIdSchema = z.string().regex(/^[a-z0-9-]+$/);
export const PageNumberSchema = z.number().int().min(1);
export const LanguageCodeSchema = z.string().regex(/^[a-z]{2}$/);

// Response schemas
export const DocumentSetSummarySchema = z.object({
  id: z.string(),
  fileName: z.string(),
  pageCount: z.number().int().positive(),
  pdfSizeBytes: z.number().int().nonnegative(),
  hasValidStructure: z.boolean(),
  availableLanguages: z.array(z.string()),
  lastModified: z.string().datetime(),
});

export const ViewerStateSchema = z.object({
  currentDocumentId: z.string().nullable(),
  currentPageNumber: z.number().int().min(1),
  paneMode: z.enum(['TWO_PANE', 'THREE_PANE']),
  panes: z.array(PaneSchema),
  isLoading: z.boolean(),
});
```

### Caching Strategy

```typescript
// Next.js cache configuration
export const revalidate = 3600; // 1 hour for document list
export const dynamic = 'force-dynamic'; // For viewer state (user-specific)

// Example API route with caching
export async function GET(request: Request) {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

### Error Handling

```typescript
// Standard error response
interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

// Error factory
export function createApiError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): Response {
  return NextResponse.json(
    { error: code, message, details },
    { status }
  );
}

// Usage
if (!documentExists(id)) {
  return createApiError(
    'DOCUMENT_NOT_FOUND',
    `Document with ID "${id}" not found`,
    404
  );
}
```

---

## Testing Strategy

### Contract Tests

Test that API responses match OpenAPI schema:

```typescript
import { describe, it, expect } from 'vitest';
import { GET as getDocuments } from '@/app/api/documents/route';
import { DocumentSetSummarySchema } from '@/lib/schemas';

describe('GET /api/documents', () => {
  it('returns valid document list', async () => {
    const response = await getDocuments(new Request('http://localhost:3000/api/documents'));
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(() => z.array(DocumentSetSummarySchema).parse(data.documents)).not.toThrow();
  });
});
```

### Integration Tests

Test full request/response cycle:

```typescript
describe('Page Navigation', () => {
  it('navigates to valid page', async () => {
    // Load document
    const docResponse = await fetch('/api/documents/test-doc');
    const doc = await docResponse.json();
    
    // Navigate to page 5
    const stateResponse = await fetch('/api/viewer/state', {
      method: 'POST',
      body: JSON.stringify({ documentId: 'test-doc', pageNumber: 5 }),
    });
    
    expect(stateResponse.status).toBe(200);
    
    // Fetch PDF page
    const pdfResponse = await fetch('/api/documents/test-doc/pages/5/pdf');
    expect(pdfResponse.status).toBe(200);
    
    // Fetch markdown page
    const mdResponse = await fetch('/api/documents/test-doc/pages/5/markdown?languageCode=en');
    expect(mdResponse.status).toBe(200);
  });
});
```

---

## Security Considerations

### Input Validation
- All path parameters validated against strict regex
- Page numbers bounded by document page count
- File paths sanitized to prevent directory traversal

### File Access
- All file reads limited to DATA_FOLDER_PATH
- Validate requested files are within allowed directory
- Use `path.resolve()` and check `.startsWith(DATA_FOLDER_PATH)`

### Rate Limiting (Future)
- Consider rate limiting for PDF rendering (CPU intensive)
- Use Next.js middleware or external service (Upstash)

---

## Next Steps

1. ✅ API contracts defined in OpenAPI spec
2. ⏭️ Implement API routes in Next.js
3. ⏭️ Generate TypeScript types from OpenAPI schema
4. ⏭️ Write contract tests for all endpoints
5. ⏭️ Document authentication strategy if needed
