import { describe, it, expect, vi } from 'vitest';
import { retry, retryFetch } from '@/lib/utils/retry';

/**
 * Unit tests for retry utilities
 * Tests FR-026a: Document load retry
 * Tests FR-026b: Page navigation retry
 */

describe('retry', () => {
  describe('retry', () => {
    it('should return result on first successful attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await retry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');

      const result = await retry(fn, { delayMs: 1 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry up to maxAttempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(retry(fn, { maxAttempts: 3, delayMs: 1 })).rejects.toThrow('Network error');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should use custom shouldRetry function', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Custom error'));
      const shouldRetry = vi.fn().mockReturnValue(false);

      await expect(retry(fn, { shouldRetry, delayMs: 1 })).rejects.toThrow('Custom error');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should retry on retryable network errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fetch failed'));

      await expect(retry(fn, { maxAttempts: 2, delayMs: 1 })).rejects.toThrow('fetch failed');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Validation error'));

      await expect(retry(fn, { delayMs: 1 })).rejects.toThrow('Validation error');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle non-Error rejections', async () => {
      const fn = vi.fn().mockRejectedValue('string error');

      await expect(retry(fn, { maxAttempts: 2, delayMs: 1 })).rejects.toThrow('string error');
    });

    it('should use default maxAttempts of 3', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(retry(fn, { delayMs: 1 })).rejects.toThrow('Network error');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');

      const result = await retry(fn, { maxAttempts: 3, delayMs: 1 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should handle case-insensitive error matching', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('NETWORK ERROR'));

      await expect(retry(fn, { maxAttempts: 2, delayMs: 1 })).rejects.toThrow('NETWORK ERROR');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should stop retrying when shouldRetry returns false', async () => {
      let callCount = 0;
      const shouldRetry = vi.fn(() => {
        callCount++;
        return callCount === 1; // Only retry once
      });

      const fn = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(retry(fn, { maxAttempts: 5, shouldRetry, delayMs: 1 })).rejects.toThrow(
        'Network error'
      );
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on various network error types', async () => {
      const errors = [
        'timeout occurred',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'Failed to fetch',
        '500 error',
        '502 error',
        '503 error',
        '504 error',
      ];

      for (const errorMsg of errors) {
        const fn = vi.fn().mockRejectedValue(new Error(errorMsg));
        await expect(retry(fn, { maxAttempts: 2, delayMs: 1 })).rejects.toThrow(errorMsg);
        expect(fn).toHaveBeenCalledTimes(2);
        vi.clearAllMocks();
      }
    });
  });

  describe('retryFetch', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should fetch successfully on first attempt', async () => {
      const mockResponse = { ok: true, status: 200 };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const response = await retryFetch('/api/test');

      expect(response).toBe(mockResponse);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('/api/test', undefined);
    });

    it('should pass fetch init options', async () => {
      const mockResponse = { ok: true, status: 200 };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const init = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
      await retryFetch('/api/test', init);

      expect(fetch).toHaveBeenCalledWith('/api/test', init);
    });

    it('should retry on 500 error', async () => {
      const errorResponse = { ok: false, status: 500, statusText: 'Internal Server Error' };
      const successResponse = { ok: true, status: 200 };

      vi.mocked(fetch)
        .mockResolvedValueOnce(errorResponse as Response)
        .mockResolvedValueOnce(successResponse as Response);

      const response = await retryFetch('/api/test', undefined, { delayMs: 1 });

      expect(response).toBe(successResponse);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on 502 error', async () => {
      const errorResponse = { ok: false, status: 502, statusText: 'Bad Gateway' };
      const successResponse = { ok: true, status: 200 };

      vi.mocked(fetch)
        .mockResolvedValueOnce(errorResponse as Response)
        .mockResolvedValueOnce(successResponse as Response);

      const response = await retryFetch('/api/test', undefined, { delayMs: 1 });

      expect(response).toBe(successResponse);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on 503 error', async () => {
      const errorResponse = { ok: false, status: 503, statusText: 'Service Unavailable' };
      const successResponse = { ok: true, status: 200 };

      vi.mocked(fetch)
        .mockResolvedValueOnce(errorResponse as Response)
        .mockResolvedValueOnce(successResponse as Response);

      const response = await retryFetch('/api/test', undefined, { delayMs: 1 });

      expect(response).toBe(successResponse);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 404 error', async () => {
      const errorResponse = { ok: false, status: 404, statusText: 'Not Found' };

      vi.mocked(fetch).mockResolvedValue(errorResponse as Response);

      const response = await retryFetch('/api/test');

      expect(response).toBe(errorResponse);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 400 error', async () => {
      const errorResponse = { ok: false, status: 400, statusText: 'Bad Request' };

      vi.mocked(fetch).mockResolvedValue(errorResponse as Response);

      const response = await retryFetch('/api/test');

      expect(response).toBe(errorResponse);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should use custom retry options', async () => {
      const errorResponse = { ok: false, status: 500, statusText: 'Internal Server Error' };

      vi.mocked(fetch).mockResolvedValue(errorResponse as Response);

      await expect(
        retryFetch('/api/test', undefined, { maxAttempts: 5, delayMs: 1 })
      ).rejects.toThrow('HTTP 500');
      expect(fetch).toHaveBeenCalledTimes(5);
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, status: 200 } as Response);

      const response = await retryFetch('/api/test', undefined, { delayMs: 1 });

      expect(response).toMatchObject({ ok: true, status: 200 });
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries', async () => {
      const errorResponse = { ok: false, status: 500, statusText: 'Internal Server Error' };

      vi.mocked(fetch).mockResolvedValue(errorResponse as Response);

      await expect(
        retryFetch('/api/test', undefined, { maxAttempts: 2, delayMs: 1 })
      ).rejects.toThrow('HTTP 500: Internal Server Error');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should use default retry options when not provided', async () => {
      const errorResponse = { ok: false, status: 500, statusText: 'Internal Server Error' };

      vi.mocked(fetch).mockResolvedValue(errorResponse as Response);

      await expect(retryFetch('/api/test', undefined, { delayMs: 1 })).rejects.toThrow('HTTP 500');
      expect(fetch).toHaveBeenCalledTimes(3); // Default maxAttempts
    });
  });
});
