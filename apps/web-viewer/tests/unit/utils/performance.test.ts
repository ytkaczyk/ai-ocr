import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PerformanceMonitor,
  getPerformanceMonitor,
  measureAsync,
  checkDocumentSizeWarning,
  getPerformanceDegradationMessage,
  getPerformanceOptimizations,
} from '@/lib/utils/performance';

/**
 * Unit tests for performance monitoring utilities
 * Tests FR-031: Performance degradation handling for large documents
 * Tests T103a: Performance tracking and degradation detection
 */

describe('performance', () => {
  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    it('should record navigation timing', () => {
      monitor.recordNavigation(1, 500);
      
      const metrics = monitor.getMetrics();
      
      expect(metrics.recentNavigations).toHaveLength(1);
      expect(metrics.recentNavigations[0]).toMatchObject({
        pageNumber: 1,
        duration: 500,
      });
    });

    it('should track multiple navigations', () => {
      monitor.recordNavigation(1, 500);
      monitor.recordNavigation(2, 600);
      monitor.recordNavigation(3, 700);
      
      const metrics = monitor.getMetrics();
      
      expect(metrics.recentNavigations).toHaveLength(3);
    });

    it('should keep only last 10 navigations', () => {
      for (let i = 1; i <= 15; i++) {
        monitor.recordNavigation(i, 500);
      }
      
      const stats = monitor.getStatistics();
      
      expect(stats.count).toBe(10);
    });

    it('should calculate average navigation time', () => {
      monitor.recordNavigation(1, 400);
      monitor.recordNavigation(2, 600);
      monitor.recordNavigation(3, 500);
      
      const metrics = monitor.getMetrics();
      
      expect(metrics.averageNavigationTime).toBe(500);
    });

    it('should count slow navigations (> 1000ms)', () => {
      monitor.recordNavigation(1, 500);
      monitor.recordNavigation(2, 1100);
      monitor.recordNavigation(3, 1200);
      monitor.recordNavigation(4, 800);
      monitor.recordNavigation(5, 1500);
      
      const metrics = monitor.getMetrics();
      
      // Last 5 navigations include 3 slow ones
      expect(metrics.slowNavigationCount).toBe(3);
    });

    it('should detect degradation after 3 consecutive slow navigations', () => {
      monitor.recordNavigation(1, 1100);
      
      expect(monitor.isDegraded()).toBe(false);
      
      monitor.recordNavigation(2, 1200);
      
      expect(monitor.isDegraded()).toBe(false);
      
      monitor.recordNavigation(3, 1300);
      
      expect(monitor.isDegraded()).toBe(true);
    });

    it('should reset consecutive slow count on fast navigation', () => {
      monitor.recordNavigation(1, 1100);
      monitor.recordNavigation(2, 1200);
      monitor.recordNavigation(3, 500); // Fast navigation
      monitor.recordNavigation(4, 1100);
      
      expect(monitor.isDegraded()).toBe(false);
    });

    it('should reset all metrics', () => {
      monitor.recordNavigation(1, 1100);
      monitor.recordNavigation(2, 1200);
      monitor.recordNavigation(3, 1300);
      
      expect(monitor.isDegraded()).toBe(true);
      
      monitor.reset();
      
      expect(monitor.isDegraded()).toBe(false);
      expect(monitor.getMetrics().recentNavigations).toHaveLength(0);
    });

    it('should calculate statistics correctly', () => {
      monitor.recordNavigation(1, 300);
      monitor.recordNavigation(2, 500);
      monitor.recordNavigation(3, 700);
      
      const stats = monitor.getStatistics();
      
      expect(stats.min).toBe(300);
      expect(stats.max).toBe(700);
      expect(stats.avg).toBe(500);
      expect(stats.count).toBe(3);
    });

    it('should return zero statistics when no navigations', () => {
      const stats = monitor.getStatistics();
      
      expect(stats).toEqual({
        min: 0,
        max: 0,
        avg: 0,
        count: 0,
      });
    });

    it('should handle single navigation statistics', () => {
      monitor.recordNavigation(1, 600);
      
      const stats = monitor.getStatistics();
      
      expect(stats.min).toBe(600);
      expect(stats.max).toBe(600);
      expect(stats.avg).toBe(600);
      expect(stats.count).toBe(1);
    });

    it('should calculate average for recent 5 navigations only', () => {
      monitor.recordNavigation(1, 1000);
      monitor.recordNavigation(2, 1000);
      monitor.recordNavigation(3, 1000);
      monitor.recordNavigation(4, 100);
      monitor.recordNavigation(5, 100);
      monitor.recordNavigation(6, 100);
      
      const metrics = monitor.getMetrics();
      
      // Last 5: 1000, 1000, 100, 100, 100 -> avg = 460
      expect(metrics.averageNavigationTime).toBe(460);
    });

    it('should update metrics isDegraded based on consecutive slow navigations', () => {
      monitor.recordNavigation(1, 1100);
      monitor.recordNavigation(2, 1200);
      
      let metrics = monitor.getMetrics();
      expect(metrics.isDegraded).toBe(false);
      
      monitor.recordNavigation(3, 1300);
      
      metrics = monitor.getMetrics();
      expect(metrics.isDegraded).toBe(true);
    });
  });

  describe('getPerformanceMonitor', () => {
    it('should return singleton instance', () => {
      const monitor1 = getPerformanceMonitor();
      const monitor2 = getPerformanceMonitor();
      
      expect(monitor1).toBe(monitor2);
    });
  });

  describe('measureAsync', () => {
    beforeEach(() => {
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(150);
    });

    it('should measure async operation duration', async () => {
      const operation = vi.fn().mockResolvedValue('result');
      const onComplete = vi.fn();
      
      const result = await measureAsync(operation, onComplete);
      
      expect(result).toBe('result');
      expect(onComplete).toHaveBeenCalledWith(150);
    });

    it('should work without onComplete callback', async () => {
      const operation = vi.fn().mockResolvedValue('result');
      
      const result = await measureAsync(operation);
      
      expect(result).toBe('result');
    });

    it('should measure duration even on error', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Test error'));
      const onComplete = vi.fn();
      
      await expect(measureAsync(operation, onComplete)).rejects.toThrow('Test error');
      
      expect(onComplete).toHaveBeenCalledWith(150);
    });

    it('should re-throw the original error', async () => {
      const error = new Error('Original error');
      const operation = vi.fn().mockRejectedValue(error);
      
      await expect(measureAsync(operation)).rejects.toThrow(error);
    });
  });

  describe('checkDocumentSizeWarning', () => {
    it('should return null for small documents (< 200 pages)', () => {
      expect(checkDocumentSizeWarning(50)).toBeNull();
      expect(checkDocumentSizeWarning(100)).toBeNull();
      expect(checkDocumentSizeWarning(199)).toBeNull();
    });

    it('should return "warning" for 200-500 pages', () => {
      expect(checkDocumentSizeWarning(200)).toBe('warning');
      expect(checkDocumentSizeWarning(300)).toBe('warning');
      expect(checkDocumentSizeWarning(500)).toBe('warning');
    });

    it('should return "blocking" for > 500 pages', () => {
      expect(checkDocumentSizeWarning(501)).toBe('blocking');
      expect(checkDocumentSizeWarning(1000)).toBe('blocking');
      expect(checkDocumentSizeWarning(10000)).toBe('blocking');
    });

    it('should handle edge cases', () => {
      expect(checkDocumentSizeWarning(0)).toBeNull();
      expect(checkDocumentSizeWarning(1)).toBeNull();
    });
  });

  describe('getPerformanceDegradationMessage', () => {
    it('should return null when not degraded', () => {
      const metrics = {
        recentNavigations: [],
        averageNavigationTime: 500,
        slowNavigationCount: 0,
        isDegraded: false,
      };
      
      const message = getPerformanceDegradationMessage(metrics);
      
      expect(message).toBeNull();
    });

    it('should return message when degraded', () => {
      const metrics = {
        recentNavigations: [],
        averageNavigationTime: 1234.5678,
        slowNavigationCount: 3,
        isDegraded: true,
      };
      
      const message = getPerformanceDegradationMessage(metrics);
      
      expect(message).toBe(
        'Performance degraded: Navigation taking 1235ms on average. ' +
        'Consider reducing document size or closing other applications.'
      );
    });

    it('should round average time in message', () => {
      const metrics = {
        recentNavigations: [],
        averageNavigationTime: 1567.89,
        slowNavigationCount: 3,
        isDegraded: true,
      };
      
      const message = getPerformanceDegradationMessage(metrics);
      
      expect(message).toContain('1568ms');
    });
  });

  describe('getPerformanceOptimizations', () => {
    it('should return null for small documents with good performance', () => {
      const metrics = {
        recentNavigations: [],
        averageNavigationTime: 500,
        slowNavigationCount: 0,
        isDegraded: false,
      };
      
      const optimizations = getPerformanceOptimizations(100, metrics);
      
      expect(optimizations).toBeNull();
    });

    it('should recommend optimizations for large documents (>= 200 pages)', () => {
      const metrics = {
        recentNavigations: [],
        averageNavigationTime: 500,
        slowNavigationCount: 0,
        isDegraded: false,
      };
      
      const optimizations = getPerformanceOptimizations(250, metrics);
      
      expect(optimizations).toEqual({
        reducePrefetch: true,
        disableSmoothScroll: false, // Because avg is not > 500, it's exactly 500
        lowerPdfQuality: false,
        reason: 'Document has 250 pages',
      });
    });

    it('should recommend smooth scroll disable for avg > 500ms', () => {
      const metrics = {
        recentNavigations: [],
        averageNavigationTime: 600,
        slowNavigationCount: 2,
        isDegraded: true,
      };
      
      const optimizations = getPerformanceOptimizations(100, metrics);
      
      expect(optimizations).toEqual({
        reducePrefetch: false,
        disableSmoothScroll: true,
        lowerPdfQuality: false,
        reason: 'Performance degradation detected',
      });
    });

    it('should recommend PDF quality reduction for avg > 1000ms', () => {
      const metrics = {
        recentNavigations: [],
        averageNavigationTime: 1200,
        slowNavigationCount: 3,
        isDegraded: true,
      };
      
      const optimizations = getPerformanceOptimizations(100, metrics);
      
      expect(optimizations).toEqual({
        reducePrefetch: false,
        disableSmoothScroll: true,
        lowerPdfQuality: true,
        reason: 'Performance degradation detected',
      });
    });

    it('should combine large document and degraded performance recommendations', () => {
      const metrics = {
        recentNavigations: [],
        averageNavigationTime: 1200,
        slowNavigationCount: 3,
        isDegraded: true,
      };
      
      const optimizations = getPerformanceOptimizations(300, metrics);
      
      expect(optimizations).toEqual({
        reducePrefetch: true,
        disableSmoothScroll: true,
        lowerPdfQuality: true,
        reason: 'Document has 300 pages',
      });
    });

    it('should handle exactly 200 pages', () => {
      const metrics = {
        recentNavigations: [],
        averageNavigationTime: 500,
        slowNavigationCount: 0,
        isDegraded: false,
      };
      
      const optimizations = getPerformanceOptimizations(200, metrics);
      
      expect(optimizations?.reducePrefetch).toBe(true);
      expect(optimizations?.reason).toBe('Document has 200 pages');
    });

    it('should handle exactly 500ms average', () => {
      const metrics = {
        recentNavigations: [],
        averageNavigationTime: 500,
        slowNavigationCount: 2,
        isDegraded: true,
      };
      
      const optimizations = getPerformanceOptimizations(100, metrics);
      
      expect(optimizations?.disableSmoothScroll).toBe(false);
    });

    it('should handle exactly 1000ms average', () => {
      const metrics = {
        recentNavigations: [],
        averageNavigationTime: 1000,
        slowNavigationCount: 3,
        isDegraded: true,
      };
      
      const optimizations = getPerformanceOptimizations(100, metrics);
      
      expect(optimizations?.lowerPdfQuality).toBe(false);
    });
  });
});
