import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  prefetchUrl,
  prefetchAdjacentPages,
  prefetchAdjacentPagesWithCache,
} from '@/lib/utils/prefetch';

/**
 * Unit tests for prefetch utilities
 * Tests FR-024b: Prefetch adjacent pages (N-1, N+1)
 */

describe('prefetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    vi.stubGlobal('window', {
      requestIdleCallback: vi.fn((callback) => {
        callback({} as IdleDeadline);
        return 1;
      }),
      cancelIdleCallback: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('prefetchUrl', () => {
    it('should prefetch URL using fetch', async () => {
      const url = '/api/test';
      
      prefetchUrl(url);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(fetch).toHaveBeenCalledWith(url, {
        method: 'GET',
        priority: 'low',
      });
    });

    it('should use requestIdleCallback when available', async () => {
      const url = '/api/test';
      
      prefetchUrl(url);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(window.requestIdleCallback).toHaveBeenCalled();
    });

    it('should use timeout fallback when requestIdleCallback not available', async () => {
      vi.stubGlobal('window', {});
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      
      const url = '/api/test';
      
      prefetchUrl(url, 200);
      
      expect(fetch).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(200);
      
      await vi.runAllTimersAsync();
      
      expect(fetch).toHaveBeenCalledWith(url, {
        method: 'GET',
        priority: 'low',
      });
      
      vi.useRealTimers();
    });

    it('should use custom timeout', async () => {
      vi.stubGlobal('window', {});
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      
      const url = '/api/test';
      
      prefetchUrl(url, 500);
      
      vi.advanceTimersByTime(499);
      expect(fetch).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(1);
      await vi.runAllTimersAsync();
      
      expect(fetch).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should handle fetch errors gracefully', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      
      const url = '/api/test';
      
      // Should not throw
      prefetchUrl(url);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(fetch).toHaveBeenCalled();
    });

    it('should cleanup timeout when idle callback fires first', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      const url = '/api/test';
      
      prefetchUrl(url);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should cleanup idle callback when timeout fires first', async () => {
      const cancelIdleCallback = vi.fn();
      vi.stubGlobal('window', {
        requestIdleCallback: vi.fn(() => 123),
        cancelIdleCallback,
      });
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      
      const url = '/api/test';
      
      prefetchUrl(url, 100);
      
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
      
      expect(cancelIdleCallback).toHaveBeenCalledWith(123);
      
      vi.useRealTimers();
    });

    it('should handle missing cancelIdleCallback', async () => {
      vi.stubGlobal('window', {
        requestIdleCallback: vi.fn((callback) => {
          callback({} as IdleDeadline);
          return 1;
        }),
      });
      
      const url = '/api/test';
      
      // Should not throw
      prefetchUrl(url);
      
      await new Promise(resolve => setTimeout(resolve, 10));
    });
  });

  describe('prefetchAdjacentPages', () => {
    it('should prefetch previous and next pages', async () => {
      const documentId = 'test-doc';
      const currentPage = 5;
      const totalPages = 10;
      const languageCode = 'en-US';
      
      prefetchAdjacentPages(documentId, currentPage, totalPages, languageCode);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(
        '/api/documents/test-doc/pages/4/markdown?lang=en-US',
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        '/api/documents/test-doc/pages/6/markdown?lang=en-US',
        expect.any(Object)
      );
    });

    it('should only prefetch next page when on first page', async () => {
      const documentId = 'test-doc';
      const currentPage = 1;
      const totalPages = 10;
      const languageCode = 'en-US';
      
      prefetchAdjacentPages(documentId, currentPage, totalPages, languageCode);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        '/api/documents/test-doc/pages/2/markdown?lang=en-US',
        expect.any(Object)
      );
    });

    it('should only prefetch previous page when on last page', async () => {
      const documentId = 'test-doc';
      const currentPage = 10;
      const totalPages = 10;
      const languageCode = 'en-US';
      
      prefetchAdjacentPages(documentId, currentPage, totalPages, languageCode);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        '/api/documents/test-doc/pages/9/markdown?lang=en-US',
        expect.any(Object)
      );
    });

    it('should not prefetch when document has only one page', async () => {
      const documentId = 'test-doc';
      const currentPage = 1;
      const totalPages = 1;
      const languageCode = 'en-US';
      
      prefetchAdjacentPages(documentId, currentPage, totalPages, languageCode);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should encode document ID and language code', async () => {
      const documentId = 'test doc/with spaces';
      const currentPage = 2;
      const totalPages = 5;
      const languageCode = 'en-US/test';
      
      prefetchAdjacentPages(documentId, currentPage, totalPages, languageCode);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(fetch).toHaveBeenCalledWith(
        '/api/documents/test%20doc%2Fwith%20spaces/pages/1/markdown?lang=en-US%2Ftest',
        expect.any(Object)
      );
    });
  });

  describe('prefetchAdjacentPagesWithCache', () => {
    it('should prefetch and cache the request', async () => {
      const documentId = 'test-doc';
      const currentPage = 5;
      const totalPages = 10;
      const languageCode = 'en-US';
      
      prefetchAdjacentPagesWithCache(documentId, currentPage, totalPages, languageCode);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should not prefetch if already cached', async () => {
      const documentId = 'test-doc';
      const currentPage = 5;
      const totalPages = 10;
      const languageCode = 'en-US';
      
      prefetchAdjacentPagesWithCache(documentId, currentPage, totalPages, languageCode);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      vi.clearAllMocks();
      
      // Call again with same parameters
      prefetchAdjacentPagesWithCache(documentId, currentPage, totalPages, languageCode);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should cache different page/document/language combinations separately', async () => {
      prefetchAdjacentPagesWithCache('doc1', 5, 10, 'en-US');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      vi.clearAllMocks();
      
      prefetchAdjacentPagesWithCache('doc1', 6, 10, 'en-US');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(fetch).toHaveBeenCalled();
      
      vi.clearAllMocks();
      
      prefetchAdjacentPagesWithCache('doc2', 5, 10, 'en-US');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(fetch).toHaveBeenCalled();
      
      vi.clearAllMocks();
      
      prefetchAdjacentPagesWithCache('doc1', 5, 10, 'fr-FR');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(fetch).toHaveBeenCalled();
    });

    it('should limit cache size to 10 entries', async () => {
      // Fill cache with 11 entries
      for (let i = 1; i <= 11; i++) {
        prefetchAdjacentPagesWithCache(`doc-${i}`, 5, 10, 'en-US');
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      vi.clearAllMocks();
      
      // First entry should be evicted, so this should prefetch again
      prefetchAdjacentPagesWithCache('doc-1', 5, 10, 'en-US');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(fetch).toHaveBeenCalled();
    });
  });
});
