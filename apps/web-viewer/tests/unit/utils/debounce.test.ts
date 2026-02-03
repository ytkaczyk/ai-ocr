import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, debounceWithCancel, DEBOUNCE_NAVIGATION, DEBOUNCE_URL_PERSIST } from '@/lib/utils/debounce';

/**
 * Unit tests for debounce utility
 * Tests FR-024a: Navigation debounce (100ms)
 * Tests FR-024c: URL persistence debounce (500ms)
 */

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Debounce', () => {
    it('should delay function execution', () => {
      const func = vi.fn();
      const debounced = debounce(func, 100);

      debounced();
      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(99);
      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on subsequent calls', () => {
      const func = vi.fn();
      const debounced = debounce(func, 100);

      debounced();
      vi.advanceTimersByTime(50);
      debounced();
      vi.advanceTimersByTime(50);
      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to the debounced function', () => {
      const func = vi.fn();
      const debounced = debounce(func, 100);

      debounced('arg1', 'arg2', 'arg3');
      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });

    it('should use the latest arguments when called multiple times', () => {
      const func = vi.fn();
      const debounced = debounce(func, 100);

      debounced('first');
      vi.advanceTimersByTime(50);
      debounced('second');
      vi.advanceTimersByTime(50);
      debounced('third');
      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith('third');
    });

    it('should allow multiple invocations after delay', () => {
      const func = vi.fn();
      const debounced = debounce(func, 100);

      debounced('first');
      vi.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith('first');

      debounced('second');
      vi.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(2);
      expect(func).toHaveBeenCalledWith('second');
    });
  });

  describe('debounceWithCancel', () => {
    it('should provide a debounced function', () => {
      const func = vi.fn();
      const { debounced } = debounceWithCancel(func, 100);

      debounced();
      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should cancel pending invocations', () => {
      const func = vi.fn();
      const { debounced, cancel } = debounceWithCancel(func, 100);

      debounced('arg');
      vi.advanceTimersByTime(50);
      cancel();
      vi.advanceTimersByTime(100);

      expect(func).not.toHaveBeenCalled();
    });

    it('should allow new invocations after cancel', () => {
      const func = vi.fn();
      const { debounced, cancel } = debounceWithCancel(func, 100);

      debounced('first');
      cancel();
      debounced('second');
      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith('second');
    });

    it('should flush pending invocation immediately', () => {
      const func = vi.fn();
      const { debounced, flush } = debounceWithCancel(func, 100);

      debounced('immediate');
      vi.advanceTimersByTime(50);
      flush();

      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith('immediate');

      // Should not call again after the original timeout
      vi.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should do nothing when flush is called without pending invocation', () => {
      const func = vi.fn();
      const { flush } = debounceWithCancel(func, 100);

      flush();
      expect(func).not.toHaveBeenCalled();
    });

    it('should do nothing when cancel is called without pending invocation', () => {
      const func = vi.fn();
      const { cancel } = debounceWithCancel(func, 100);

      // Should not throw
      cancel();
      expect(func).not.toHaveBeenCalled();
    });

    it('should reset timer on subsequent calls in debounceWithCancel', () => {
      const func = vi.fn();
      const { debounced } = debounceWithCancel(func, 100);

      debounced('first');
      vi.advanceTimersByTime(50);
      debounced('second');
      vi.advanceTimersByTime(50);
      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith('second');
    });
  });

  describe('Debounce Constants (FR-024)', () => {
    it('should define DEBOUNCE_NAVIGATION as 100ms (FR-024a)', () => {
      expect(DEBOUNCE_NAVIGATION).toBe(100);
    });

    it('should define DEBOUNCE_URL_PERSIST as 500ms (FR-024c)', () => {
      expect(DEBOUNCE_URL_PERSIST).toBe(500);
    });

    it('should debounce navigation with correct delay', () => {
      const navigate = vi.fn();
      const debouncedNavigate = debounce(navigate, DEBOUNCE_NAVIGATION);

      debouncedNavigate(5);
      vi.advanceTimersByTime(DEBOUNCE_NAVIGATION - 1);
      expect(navigate).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(navigate).toHaveBeenCalledWith(5);
    });

    it('should debounce URL persistence with correct delay', () => {
      const persistUrl = vi.fn();
      const debouncedPersist = debounce(persistUrl, DEBOUNCE_URL_PERSIST);

      debouncedPersist('/viewer/doc/5');
      vi.advanceTimersByTime(DEBOUNCE_URL_PERSIST - 1);
      expect(persistUrl).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(persistUrl).toHaveBeenCalledWith('/viewer/doc/5');
    });
  });

  describe('Rapid Invocations (FR-024a)', () => {
    it('should handle rapid successive calls correctly', () => {
      const func = vi.fn();
      const debounced = debounce(func, 100);

      // Simulate rapid page changes
      for (let i = 1; i <= 10; i++) {
        debounced(i);
        vi.advanceTimersByTime(10); // 10ms between calls
      }

      // Function should not have been called yet
      expect(func).not.toHaveBeenCalled();

      // Wait for the full delay after the last call
      vi.advanceTimersByTime(100);

      // Should be called only once with the last value
      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith(10);
    });

    it('should handle rapid calls then pause pattern', () => {
      const func = vi.fn();
      const debounced = debounce(func, 100);

      // First burst
      debounced(1);
      debounced(2);
      debounced(3);
      vi.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith(3);

      // Second burst after pause
      debounced(4);
      debounced(5);
      debounced(6);
      vi.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(2);
      expect(func).toHaveBeenCalledWith(6);
    });
  });
});
