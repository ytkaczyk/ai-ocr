import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GET as getMarkdown } from '@/app/api/documents/[documentId]/pages/[pageNumber]/markdown/route';
import { GET as getImage } from '@/app/api/documents/[documentId]/images/[...path]/route';
import { NextRequest } from 'next/server';

/**
 * Integration tests for page content API routes (T060)
 * Tests markdown and image endpoints with real file system operations
 * 
 * Tests FR-016: Markdown rendering from file system
 * Tests FR-018: Image resolution and serving
 * Tests security validations and error handling
 */

describe('Page Content API Integration Tests', () => {
  const originalEnv = process.env;
  const testDataFolder = 'U:/source/ai-ocr/apps/web-viewer/data';

  beforeAll(() => {
    // Set environment for tests
    process.env = {
      ...originalEnv,
      DATA_FOLDER_PATH: testDataFolder,
      MAX_PDF_SIZE_MB: '100',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('GET /api/documents/[documentId]/pages/[pageNumber]/markdown', () => {
    it('should return markdown content for valid request', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/kombucha/pages/1/markdown?lang=en-US');
      const params = Promise.resolve({ documentId: 'kombucha', pageNumber: '1' });

      const response = await getMarkdown(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('application/json');
      expect(data.content).toBeTruthy();
      expect(data.content.length).toBeGreaterThan(0);
      expect(data.pageNumber).toBe(1);
      expect(data.languageCode).toBe('en-US');
      expect(data.isRaw).toBe(false);
      expect(data.fileName).toContain('kombucha');
      expect(data.sizeBytes).toBeGreaterThan(0);
    });

    it('should return raw markdown when raw=true', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/kombucha/pages/1/markdown?lang=en-US&raw=true');
      const params = Promise.resolve({ documentId: 'kombucha', pageNumber: '1' });

      const response = await getMarkdown(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toBeTruthy();
      expect(data.isRaw).toBe(true);
    });

    it('should support French locale', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/kombucha/pages/1/markdown?lang=fr-FR');
      const params = Promise.resolve({ documentId: 'kombucha', pageNumber: '1' });

      const response = await getMarkdown(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toBeTruthy();
      expect(data.languageCode).toBe('fr-FR');
    });

    it('should return 400 for invalid document ID (path traversal attempt)', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/../etc/passwd/pages/1/markdown?lang=en-US');
      const params = Promise.resolve({ documentId: '../etc/passwd', pageNumber: '1' });

      const response = await getMarkdown(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_DOCUMENT_ID');
    });

    it('should return 400 for invalid page number (negative)', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/kombucha/pages/-1/markdown?lang=en-US');
      const params = Promise.resolve({ documentId: 'kombucha', pageNumber: '-1' });

      const response = await getMarkdown(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_PAGE_NUMBER');
    });

    it('should return 400 for invalid page number (zero)', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/kombucha/pages/0/markdown?lang=en-US');
      const params = Promise.resolve({ documentId: 'kombucha', pageNumber: '0' });

      const response = await getMarkdown(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_PAGE_NUMBER');
    });

    it('should return 400 for invalid page number (non-numeric)', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/kombucha/pages/abc/markdown?lang=en-US');
      const params = Promise.resolve({ documentId: 'kombucha', pageNumber: 'abc' });

      const response = await getMarkdown(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_PAGE_NUMBER');
    });

    it('should return 400 for missing language parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/kombucha/pages/1/markdown');
      const params = Promise.resolve({ documentId: 'kombucha', pageNumber: '1' });

      const response = await getMarkdown(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('MISSING_LANGUAGE');
    });

    it('should return 400 for invalid language code format', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/kombucha/pages/1/markdown?lang=invalid');
      const params = Promise.resolve({ documentId: 'kombucha', pageNumber: '1' });

      const response = await getMarkdown(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_LANGUAGE_CODE');
    });

    it('should return 404 for non-existent page', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/kombucha/pages/999/markdown?lang=en-US');
      const params = Promise.resolve({ documentId: 'kombucha', pageNumber: '999' });

      const response = await getMarkdown(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('MARKDOWN_NOT_FOUND');
    });

    it('should return 404 for non-existent document', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/nonexistent/pages/1/markdown?lang=en-US');
      const params = Promise.resolve({ documentId: 'nonexistent', pageNumber: '1' });

      const response = await getMarkdown(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('MARKDOWN_NOT_FOUND');
    });

    it('should handle cache headers appropriately', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/kombucha/pages/1/markdown?lang=en-US');
      const params = Promise.resolve({ documentId: 'kombucha', pageNumber: '1' });

      const response = await getMarkdown(request, { params });

      expect(response.status).toBe(200);
      // Check cache-control header is set for static content
      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toBeTruthy();
    });
  });

  describe('GET /api/documents/[documentId]/images/[...path]', () => {
    it('should return image file for valid request', async () => {
      // Note: This test assumes there's at least one image in the kombucha document
      const request = new NextRequest('http://localhost:3000/api/documents/kombucha/images/en-US/kombucha.en-US_page_1_image_1.png');
      const params = Promise.resolve({ 
        documentId: 'kombucha', 
        path: ['en-US', 'kombucha.en-US_page_1_image_1.png'] 
      });

      const response = await getImage(request, { params });

      // May be 200 or 404 depending on whether image exists
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.headers.get('Content-Type')).toContain('image/');
      }
    });

    it('should return 400 for invalid document ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/../etc/images/test.png');
      const params = Promise.resolve({ 
        documentId: '../etc', 
        path: ['test.png'] 
      });

      const response = await getImage(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_DOCUMENT_ID');
    });

    it('should return 400 for missing path segments', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/kombucha/images/');
      const params = Promise.resolve({ 
        documentId: 'kombucha', 
        path: [] 
      });

      const response = await getImage(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_IMAGE_PATH');
    });

    it('should return 403 for path traversal in segments', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/kombucha/images/../../../etc/passwd');
      const params = Promise.resolve({ 
        documentId: 'kombucha', 
        path: ['..', '..', '..', 'etc', 'passwd'] 
      });

      const response = await getImage(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('PATH_TRAVERSAL_DETECTED');
    });

    it('should return 400 for unsupported file type', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/kombucha/images/en-US/malicious.exe');
      const params = Promise.resolve({ 
        documentId: 'kombucha', 
        path: ['en-US', 'malicious.exe'] 
      });

      const response = await getImage(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_FILE_TYPE');
    });

    it('should support multiple image formats', async () => {
      const formats = [
        { ext: '.png', contentType: 'image/png' },
        { ext: '.jpg', contentType: 'image/jpeg' },
        { ext: '.jpeg', contentType: 'image/jpeg' },
        { ext: '.gif', contentType: 'image/gif' },
        { ext: '.svg', contentType: 'image/svg+xml' },
        { ext: '.webp', contentType: 'image/webp' },
      ];

      for (const { ext } of formats) {
        const request = new NextRequest(`http://localhost:3000/api/documents/kombucha/images/en-US/test${ext}`);
        const params = Promise.resolve({ 
          documentId: 'kombucha', 
          path: ['en-US', `test${ext}`] 
        });

        const response = await getImage(request, { params });
        
        // Should not return 400 for valid file type
        expect(response.status).not.toBe(400);
      }
    });

    it('should return 404 for non-existent image', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/kombucha/images/en-US/nonexistent.png');
      const params = Promise.resolve({ 
        documentId: 'kombucha', 
        path: ['en-US', 'nonexistent.png'] 
      });

      const response = await getImage(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('IMAGE_NOT_FOUND');
    });

    it('should handle deeply nested image paths', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents/kombucha/images/en-US/subfolder/image.png');
      const params = Promise.resolve({ 
        documentId: 'kombucha', 
        path: ['en-US', 'subfolder', 'image.png'] 
      });

      const response = await getImage(request, { params });

      // Should not fail validation (may be 404 if path doesn't exist)
      expect([200, 404]).toContain(response.status);
    });
  });
});
