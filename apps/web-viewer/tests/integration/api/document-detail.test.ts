import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GET as getDocument } from '@/app/api/documents/[documentId]/route';
import { GET as getDocuments } from '@/app/api/documents/route';
import { documentSetSchema } from '@/lib/schemas/document';
import { getPdfPageCount } from '@/lib/utils/pdf';
import path from 'path';

/**
 * Integration tests for the document detail API route
 * Tests FR-007: Document details retrieval
 * Tests FR-019: Language version enumeration
 *
 * Regression coverage: the route validates its own payload with
 * documentSetSchema, so a response shape that drifts from the schema turns
 * every request into a 500. This suite exercises the real file system.
 */

describe('Document Detail API Integration Tests', () => {
  const originalEnv = process.env;
  const testDataFolder = path.resolve(process.cwd(), 'data');

  beforeAll(() => {
    process.env = {
      ...originalEnv,
      DATA_FOLDER_PATH: testDataFolder,
      MAX_PDF_SIZE_MB: '100',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('GET /api/documents/[documentId]', () => {
    it('should return 200 with a payload that satisfies documentSetSchema', async () => {
      const request = new Request('http://localhost:3000/api/documents/kombucha');
      const params = Promise.resolve({ documentId: 'kombucha' });

      const response = await getDocument(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(documentSetSchema.safeParse(data.document).success).toBe(true);
    });

    it('should populate every field the schema requires', async () => {
      const request = new Request('http://localhost:3000/api/documents/kombucha');
      const params = Promise.resolve({ documentId: 'kombucha' });

      const response = await getDocument(request, { params });
      const { document } = await response.json();

      expect(document.id).toBe('kombucha');
      expect(document.folderPath).toBeTruthy();
      expect(document.pdfSizeBytes).toBeGreaterThan(0);
      expect(typeof document.hasValidStructure).toBe('boolean');
      expect(document.pageCount).toBeGreaterThan(0);
    });

    it('should enumerate language versions with complete page files', async () => {
      const request = new Request('http://localhost:3000/api/documents/kombucha');
      const params = Promise.resolve({ documentId: 'kombucha' });

      const response = await getDocument(request, { params });
      const { document } = await response.json();

      expect(document.availableLanguages.length).toBeGreaterThan(0);

      for (const version of document.availableLanguages) {
        expect(version.pageFiles.length).toBeGreaterThan(0);
        expect(Array.isArray(version.missingPages)).toBe(true);
        expect(typeof version.isComplete).toBe('boolean');

        for (const pageFile of version.pageFiles) {
          expect(pageFile.pageNumber).toBeGreaterThan(0);
          expect(pageFile.fileName).toBeTruthy();
          expect(pageFile.filePath).toBeTruthy();
          expect(pageFile.exists).toBe(true);
        }
      }
    });

    it('should not leak absolute filesystem paths', async () => {
      const request = new Request('http://localhost:3000/api/documents/kombucha');
      const params = Promise.resolve({ documentId: 'kombucha' });

      const response = await getDocument(request, { params });
      const { document } = await response.json();

      expect(document.pdfPath).not.toContain(testDataFolder);
      expect(document.folderPath).not.toContain(testDataFolder);
    });

    it('should take pageCount from the PDF rather than the markdown file count', async () => {
      const pdfPath = path.join(testDataFolder, 'kombucha.pdf');
      const expectedPageCount = await getPdfPageCount(pdfPath);

      const request = new Request('http://localhost:3000/api/documents/kombucha');
      const params = Promise.resolve({ documentId: 'kombucha' });

      const response = await getDocument(request, { params });
      const { document } = await response.json();

      expect(document.pageCount).toBe(expectedPageCount);
      expect(document.validationErrors).toEqual([]);
    });

    it('should fall back to markdown counts when the PDF cannot be parsed', async () => {
      // test-corrupted-pdf.pdf is an intentionally unparseable fixture
      const request = new Request('http://localhost:3000/api/documents/test-corrupted-pdf');
      const params = Promise.resolve({ documentId: 'test-corrupted-pdf' });

      const response = await getDocument(request, { params });
      const { document } = await response.json();

      expect(response.status).toBe(200);
      expect(document.pageCount).toBeGreaterThan(0);
      expect(document.validationErrors.length).toBeGreaterThan(0);
      expect(document.hasValidStructure).toBe(false);
    });

    it('should agree with the list endpoint on pageCount', async () => {
      const listResponse = await getDocuments();
      const { documents } = await listResponse.json();
      const listed = documents.find((d: { id: string }) => d.id === 'kombucha');

      const request = new Request('http://localhost:3000/api/documents/kombucha');
      const params = Promise.resolve({ documentId: 'kombucha' });
      const { document } = await (await getDocument(request, { params })).json();

      expect(listed.pageCount).toBe(document.pageCount);
    });

    it('should return 404 for a non-existent document', async () => {
      const request = new Request('http://localhost:3000/api/documents/nonexistent');
      const params = Promise.resolve({ documentId: 'nonexistent' });

      const response = await getDocument(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('DOCUMENT_NOT_FOUND');
    });

    it('should return 400 for a path traversal attempt', async () => {
      const request = new Request('http://localhost:3000/api/documents/../etc/passwd');
      const params = Promise.resolve({ documentId: '../etc/passwd' });

      const response = await getDocument(request, { params });

      expect(response.status).toBe(400);
    });
  });
});
