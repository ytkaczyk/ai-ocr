# API Documentation

The OCR Translation Comparison Viewer exposes a REST API for document management and page content retrieval. All endpoints are implemented as Next.js API routes.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: Configure via environment variables

## Authentication

Currently, no authentication is required. The API is designed for internal use within a trusted network.

## Endpoints

### Documents

#### List All Documents

```http
GET /api/documents
```

Scans the configured `DATA_FOLDER_PATH` and returns all discovered document sets.

**Response**

```json
{
  "documents": [
    {
      "id": "contract-2024",
      "title": "Contract 2024",
      "pageCount": 42,
      "languageVersions": [
        {
          "languageCode": "en-US",
          "isRaw": false,
          "pageCount": 42
        },
        {
          "languageCode": "es-ES",
          "isRaw": false,
          "pageCount": 42
        }
      ],
      "pdfPath": "/data/contract-2024.pdf",
      "createdAt": "2025-10-17T10:30:00Z"
    }
  ],
  "totalCount": 12,
  "scannedAt": "2025-10-17T10:30:00Z"
}
```

**Error Responses**

- `500 Internal Server Error`: Failed to scan data folder

---

#### Get Document Details

```http
GET /api/documents/{documentId}
```

Retrieves complete metadata for a specific document set.

**Parameters**

- `documentId` (path, required): Document identifier (filename without extension)

**Response**

```json
{
  "id": "contract-2024",
  "title": "Contract 2024",
  "pageCount": 42,
  "languageVersions": [
    {
      "languageCode": "en-US",
      "isRaw": false,
      "pageCount": 42,
      "folderPath": "/data/contract-2024/en-US"
    }
  ],
  "pdfPath": "/data/contract-2024.pdf",
  "pdfSizeMB": 12.5,
  "createdAt": "2025-10-17T10:30:00Z",
  "modifiedAt": "2025-10-17T14:22:00Z"
}
```

**Error Responses**

- `404 Not Found`: Document does not exist
- `500 Internal Server Error`: Failed to read document metadata

---

#### Validate Document Structure

```http
POST /api/documents/{documentId}/validate
```

Checks folder structure, file naming conventions, and page counts.

**Parameters**

- `documentId` (path, required): Document identifier

**Response**

```json
{
  "isValid": true,
  "errors": [],
  "warnings": [
    "Page 47 missing in raw.en-US folder"
  ]
}
```

**Error Responses**

- `400 Bad Request`: Invalid document structure
- `404 Not Found`: Document does not exist
- `413 Payload Too Large`: PDF exceeds `MAX_PDF_SIZE_MB`
- `500 Internal Server Error`: Validation failed

---

### Pages

#### Get PDF Page Content

```http
GET /api/documents/{documentId}/pages/{pageNumber}/pdf
```

Renders a specific PDF page for display in the viewer.

**Parameters**

- `documentId` (path, required): Document identifier
- `pageNumber` (path, required): Page number (1-based index)
- `scale` (query, optional): Render scale factor (0.5-3.0, default: 1.0)

**Response**

```json
{
  "pageNumber": 5,
  "width": 612,
  "height": 792,
  "pdfPath": "/data/contract-2024.pdf",
  "scale": 1.0
}
```

**Error Responses**

- `400 Bad Request`: Invalid page number or scale
- `404 Not Found`: Document or page does not exist
- `413 Payload Too Large`: PDF exceeds size limit
- `500 Internal Server Error`: PDF rendering failed

---

#### Get Markdown Page Content

```http
GET /api/documents/{documentId}/pages/{pageNumber}/markdown?languageCode=en-US&preferProcessed=true
```

Retrieves markdown content for a specific page and language version.

**Parameters**

- `documentId` (path, required): Document identifier
- `pageNumber` (path, required): Page number (1-based index)
- `languageCode` (query, required): Language code (IETF BCP 47 format, e.g., `en-US`)
- `preferProcessed` (query, optional): Prefer processed over raw version (default: `true`)

**Response**

```json
{
  "content": "# Page Title\n\nMarkdown content here...",
  "languageCode": "en-US",
  "isRaw": false,
  "pageNumber": 5,
  "filePath": "/data/contract-2024/en-US/contract-2024.en-US_page_5.md",
  "images": [
    {
      "path": "images/diagram.png",
      "alt": "System diagram"
    }
  ]
}
```

**Error Responses**

- `400 Bad Request`: Invalid language code or page number
- `404 Not Found`: Markdown file does not exist
- `500 Internal Server Error`: Failed to read markdown file

---

#### Get Image File

```http
GET /api/documents/{documentId}/images/{languageCode}/{imagePath}
```

Retrieves an image file referenced in markdown content.

**Parameters**

- `documentId` (path, required): Document identifier
- `languageCode` (query, required): Language code
- `imagePath` (path, required): Relative path within language folder

**Response**

Binary image data (image/png, image/jpeg, etc.)

**Error Responses**

- `404 Not Found`: Image file does not exist
- `500 Internal Server Error`: Failed to read image file

---

## Data Models

### DocumentSet

```typescript
interface DocumentSet {
  id: string;                        // Unique identifier (filename without extension)
  title: string;                     // Display name
  pageCount: number;                 // Total pages in PDF
  languageVersions: LanguageVersion[]; // Available language versions
  pdfPath: string;                   // Absolute path to PDF file
  pdfSizeMB: number;                 // PDF file size in megabytes
  createdAt: string;                 // ISO 8601 timestamp
  modifiedAt: string;                // ISO 8601 timestamp
}
```

### LanguageVersion

```typescript
interface LanguageVersion {
  languageCode: string;              // IETF BCP 47 format (e.g., en-US, es-ES)
  isRaw: boolean;                    // Raw OCR vs processed
  pageCount: number;                 // Pages available for this language
  folderPath: string;                // Absolute path to language folder
}
```

### MarkdownPageContent

```typescript
interface MarkdownPageContent {
  content: string;                   // Raw markdown content
  languageCode: string;              // Language code
  isRaw: boolean;                    // Raw vs processed
  pageNumber: number;                // Page number (1-based)
  filePath: string;                  // Absolute path to markdown file
  images: ImageReference[];          // Referenced images
}
```

### ImageReference

```typescript
interface ImageReference {
  path: string;                      // Relative path from language folder
  alt: string;                       // Alt text for accessibility
}
```

### Error Response

```typescript
interface ErrorResponse {
  code: string;                      // Error code (e.g., DOC_NOT_FOUND)
  message: string;                   // User-friendly error message
  details?: string;                  // Additional error details (dev mode only)
  timestamp: string;                 // ISO 8601 timestamp
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `DOC_NOT_FOUND` | 404 | Document does not exist |
| `PAGE_NOT_FOUND` | 404 | Page number out of range |
| `LANG_NOT_FOUND` | 404 | Language version not available |
| `FILE_NOT_FOUND` | 404 | File does not exist |
| `INVALID_STRUCTURE` | 400 | Folder structure invalid |
| `INVALID_FILENAME` | 400 | Filename validation failed |
| `INVALID_PAGE_NUMBER` | 400 | Page number invalid |
| `INVALID_LANGUAGE_CODE` | 400 | Language code format invalid |
| `PDF_TOO_LARGE` | 413 | PDF exceeds MAX_PDF_SIZE_MB |
| `PATH_TRAVERSAL` | 400 | Path traversal attempt detected |
| `SYMLINK_REJECTED` | 400 | Symlink detected and rejected |
| `SCAN_FAILED` | 500 | Failed to scan data folder |
| `READ_FAILED` | 500 | Failed to read file |
| `RENDER_FAILED` | 500 | PDF rendering failed |
| `PARSE_FAILED` | 500 | Markdown parsing failed |

## Security

### Path Traversal Prevention

All file system operations validate paths to prevent traversal attacks:
- Paths must be within `DATA_FOLDER_PATH`
- Symlinks are rejected
- Filenames validated against regex: `^[a-zA-Z0-9_-]+$`

### Input Sanitization

All user inputs are validated:
- Language codes must match IETF BCP 47 format
- Page numbers must be positive integers
- Document IDs validated against filename rules

### Error Messages

Error messages never disclose internal paths:
- Generic messages for security violations
- Detailed messages only in development mode
- Error codes for troubleshooting

## Rate Limiting

Currently not implemented. For production deployments, consider:
- Rate limiting middleware (e.g., `express-rate-limit`)
- CDN-level rate limiting (Cloudflare, AWS CloudFront)
- API Gateway with throttling (AWS API Gateway, Azure API Management)

## Caching

API routes implement caching headers:
- Document metadata: 1 hour (Cache-Control: max-age=3600)
- Page content: Stale-while-revalidate (Cache-Control: max-age=3600, stale-while-revalidate=86400)
- Static assets: 1 year (Cache-Control: public, max-age=31536000, immutable)

## Examples

### Fetch Document List

```typescript
const response = await fetch('/api/documents');
const data = await response.json();
console.log(`Found ${data.totalCount} documents`);
```

### Load Specific Page

```typescript
const documentId = 'contract-2024';
const pageNumber = 5;
const languageCode = 'en-US';

const response = await fetch(
  `/api/documents/${documentId}/pages/${pageNumber}/markdown?languageCode=${languageCode}`
);
const page = await response.json();
console.log(page.content);
```

### Handle Errors

```typescript
try {
  const response = await fetch('/api/documents/invalid-doc');
  if (!response.ok) {
    const error = await response.json();
    console.error(`Error ${error.code}: ${error.message}`);
  }
} catch (err) {
  console.error('Network error:', err);
}
```

## OpenAPI Specification

The complete OpenAPI 3.1 specification is available at:
- [specs/001-ocr-translation-viewer/contracts/openapi.yaml](../../../specs/001-ocr-translation-viewer/contracts/openapi.yaml)

To generate interactive API documentation:
```bash
npx @redocly/cli preview-docs specs/001-ocr-translation-viewer/contracts/openapi.yaml
```

## Testing

API routes are tested with:
- Integration tests: `tests/integration/api/*.test.ts`
- E2E tests: `tests/e2e/*.spec.ts`
- Contract tests: Zod schema validation

Run tests:
```bash
npm run test                 # Integration tests
npm run test:e2e             # E2E tests
```

## Support

For API issues:
1. Check error codes and messages
2. Review [OpenAPI specification](../../../specs/001-ocr-translation-viewer/contracts/openapi.yaml)
3. Consult [README.md](../README.md) troubleshooting section
4. Create GitHub issue with reproduction steps
