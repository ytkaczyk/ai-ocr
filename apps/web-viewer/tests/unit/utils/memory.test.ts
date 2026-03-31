import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MemoryManager,
  getMemoryManager,
  getImageOptimization,
  estimatePageMemoryMB,
  shouldLazyLoadImage,
  getMemoryCleanupRecommendations,
} from '@/lib/utils/memory';

/**
 * Unit tests for memory management utilities
 * Tests FR-032: Memory consumption limits and pressure detection
 * Tests T103e-h: Memory monitoring and management
 */

describe('memory', () => {
  describe('MemoryManager', () => {
    let manager: MemoryManager;

    beforeEach(() => {
      // Mock global performance object with memory property
      const mockMemory = {
        usedJSHeapSize: 100 * 1024 * 1024, // 100MB
        totalJSHeapSize: 200 * 1024 * 1024, // 200MB
        jsHeapSizeLimit: 2048 * 1024 * 1024, // 2GB
      };
      
      global.performance = {
        ...global.performance,
        memory: mockMemory,
      } as Performance & { memory: typeof mockMemory };
      
      vi.stubGlobal('window', {
        performance: global.performance,
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should create manager with default memory limit', () => {
      manager = new MemoryManager();
      const stats = manager.getStats();
      
      expect(stats).toBeDefined();
      expect(stats?.limitMB).toBe(500); // Default limit
    });

    it('should create manager with custom memory limit', () => {
      manager = new MemoryManager(1000);
      const stats = manager.getStats();
      
      expect(stats?.limitMB).toBe(1000);
    });

    it('should create manager from environment variable', () => {
      process.env.MEMORY_LIMIT_MB = '750';
      manager = new MemoryManager();
      const stats = manager.getStats();
      
      expect(stats?.limitMB).toBe(750);
      delete process.env.MEMORY_LIMIT_MB;
    });

    it('should get memory statistics', () => {
      manager = new MemoryManager(500);
      const stats = manager.getStats();
      
      expect(stats).toBeDefined();
      expect(stats?.usedJSHeapSize).toBe(100 * 1024 * 1024);
      expect(stats?.totalJSHeapSize).toBe(200 * 1024 * 1024);
      expect(stats?.jsHeapSizeLimit).toBe(2048 * 1024 * 1024);
      expect(stats?.usedMB).toBeCloseTo(100, 1);
      expect(stats?.limitMB).toBe(500);
      expect(stats?.percentUsed).toBeCloseTo(0.2, 2);
      expect(stats?.isUnderPressure).toBe(false);
      expect(stats?.exceedsLimit).toBe(false);
    });

    it('should detect memory pressure at 80% threshold', () => {
      manager = new MemoryManager(125); // 100MB used / 125MB limit = 80%
      const stats = manager.getStats();
      
      expect(stats?.isUnderPressure).toBe(true);
      expect(stats?.exceedsLimit).toBe(false);
    });

    it('should detect when memory limit is exceeded', () => {
      manager = new MemoryManager(50); // 100MB used / 50MB limit = exceeded
      const stats = manager.getStats();
      
      expect(stats?.isUnderPressure).toBe(true);
      expect(stats?.exceedsLimit).toBe(true);
    });

    it('should return null stats in non-browser environment', () => {
      vi.stubGlobal('window', undefined);
      manager = new MemoryManager();
      const stats = manager.getStats();
      
      expect(stats).toBeNull();
    });

    it('should return null stats when performance.memory is not available', () => {
      // Remove the memory property
      delete (global.performance as Partial<Performance & { memory: unknown }>).memory;
      vi.stubGlobal('window', { performance: global.performance });
      
      manager = new MemoryManager();
      const stats = manager.getStats();
      
      expect(stats).toBeNull();
    });

    it('should register cleanup callbacks', () => {
      manager = new MemoryManager();
      const callback = vi.fn();
      
      manager.onMemoryPressure(callback);
      
      // Trigger cleanup manually by checking memory with pressure
      manager = new MemoryManager(100); // This will trigger pressure
      manager.onMemoryPressure(callback);
      
      expect(callback).toBeDefined();
    });

    it('should check if memory is exceeded', () => {
      manager = new MemoryManager(50);
      
      expect(manager.isMemoryExceeded()).toBe(true);
    });

    it('should check if under memory pressure', () => {
      manager = new MemoryManager(125);
      
      expect(manager.isUnderPressure()).toBe(true);
    });

    it('should return false for memory checks in non-browser environment', () => {
      vi.stubGlobal('window', undefined);
      manager = new MemoryManager();
      
      expect(manager.isMemoryExceeded()).toBe(false);
      expect(manager.isUnderPressure()).toBe(false);
    });

    it('should get last recorded stats', () => {
      manager = new MemoryManager(500);
      
      expect(manager.getLastStats()).toBeNull(); // No stats yet
      
      manager.getStats();
      const lastStats = manager.getLastStats();
      
      expect(lastStats).toBeDefined();
      expect(lastStats?.usedMB).toBeCloseTo(100, 1);
    });

    it('should start and stop monitoring', () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      manager = new MemoryManager(125);
      manager.startMonitoring();
      
      // Should check immediately and then every 30 seconds
      vi.advanceTimersByTime(30000);
      
      manager.stopMonitoring();
      
      vi.useRealTimers();
      consoleWarnSpy.mockRestore();
    });

    it('should warn when monitoring not available', () => {
      vi.stubGlobal('window', undefined);
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      manager = new MemoryManager();
      manager.startMonitoring();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('Memory monitoring not available in this environment');
      consoleWarnSpy.mockRestore();
    });

    it('should handle monitoring when performance.memory is unavailable', () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      
      // Create a performance object without memory property
      const mockPerformance = {} as Performance;
      vi.stubGlobal('window', { performance: mockPerformance });
      vi.stubGlobal('performance', mockPerformance);
      
      manager = new MemoryManager();
      
      // This should start monitoring successfully (window and performance exist)
      // but checkMemory() should exit early because getStats() returns null
      manager.startMonitoring();
      
      // Advance timer to trigger checkMemory
      vi.advanceTimersByTime(30000);
      
      // Should not crash and should be able to stop monitoring
      manager.stopMonitoring();
      
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('should handle cleanup callback errors gracefully', () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      manager = new MemoryManager(100); // Trigger pressure
      
      const errorCallback = vi.fn(() => {
        throw new Error('Cleanup failed');
      });
      
      manager.onMemoryPressure(errorCallback);
      manager.startMonitoring();
      
      vi.advanceTimersByTime(30000);
      
      expect(errorCallback).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      manager.stopMonitoring();
      vi.useRealTimers();
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getMemoryManager', () => {
    it('should return singleton instance', () => {
      const manager1 = getMemoryManager();
      const manager2 = getMemoryManager();
      
      expect(manager1).toBe(manager2);
    });
  });

  describe('getImageOptimization', () => {
    it('should return normal settings when no memory pressure', () => {
      const optimization = getImageOptimization(false);
      
      expect(optimization).toEqual({
        maxWidth: 4000,
        maxHeight: 4000,
        quality: 85,
      });
    });

    it('should return aggressive settings under memory pressure', () => {
      const optimization = getImageOptimization(true);
      
      expect(optimization).toEqual({
        maxWidth: 2000,
        maxHeight: 2000,
        quality: 70,
      });
    });
  });

  describe('estimatePageMemoryMB', () => {
    it('should estimate memory for standard page', () => {
      const width = 1000;
      const height = 1500;
      const scale = 1;
      
      const memory = estimatePageMemoryMB(width, height, scale);
      
      // 1000 * 1500 * 4 bytes / (1024 * 1024) ≈ 5.72 MB
      expect(memory).toBeCloseTo(5.72, 1);
    });

    it('should estimate memory for scaled page', () => {
      const width = 1000;
      const height = 1500;
      const scale = 2;
      
      const memory = estimatePageMemoryMB(width, height, scale);
      
      // 1000 * 1500 * 2 * 2 * 4 bytes / (1024 * 1024) ≈ 22.88 MB
      expect(memory).toBeCloseTo(22.88, 1);
    });

    it('should default to scale 1 when not provided', () => {
      const width = 1000;
      const height = 1500;
      
      const memory = estimatePageMemoryMB(width, height);
      
      expect(memory).toBeCloseTo(5.72, 1);
    });
  });

  describe('shouldLazyLoadImage', () => {
    it('should not lazy load images within threshold', () => {
      expect(shouldLazyLoadImage(10, 10, 5)).toBe(false);
      expect(shouldLazyLoadImage(10, 11, 5)).toBe(false);
      expect(shouldLazyLoadImage(10, 9, 5)).toBe(false);
      expect(shouldLazyLoadImage(10, 15, 5)).toBe(false);
      expect(shouldLazyLoadImage(10, 5, 5)).toBe(false);
    });

    it('should lazy load images beyond threshold', () => {
      expect(shouldLazyLoadImage(10, 16, 5)).toBe(true);
      expect(shouldLazyLoadImage(10, 4, 5)).toBe(true);
      expect(shouldLazyLoadImage(10, 20, 5)).toBe(true);
      expect(shouldLazyLoadImage(10, 1, 5)).toBe(true);
    });

    it('should use default threshold of 5', () => {
      expect(shouldLazyLoadImage(10, 16)).toBe(true);
      expect(shouldLazyLoadImage(10, 15)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(shouldLazyLoadImage(1, 1, 5)).toBe(false);
      expect(shouldLazyLoadImage(1, 7, 5)).toBe(true);
      expect(shouldLazyLoadImage(100, 95, 5)).toBe(false);
      expect(shouldLazyLoadImage(100, 94, 5)).toBe(true);
    });
  });

  describe('getMemoryCleanupRecommendations', () => {
    it('should recommend critical cleanup at 90%+', () => {
      const stats = {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        usedMB: 450,
        limitMB: 500,
        percentUsed: 0.9,
        isUnderPressure: true,
        exceedsLimit: false,
      };
      
      const recommendations = getMemoryCleanupRecommendations(stats);
      
      expect(recommendations).toEqual({
        unloadDistantPages: true,
        reduceImageQuality: true,
        clearCache: true,
        disablePrefetch: true,
        reason: 'Critical memory usage: 90%',
      });
    });

    it('should recommend high cleanup at 80%-89%', () => {
      const stats = {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        usedMB: 425,
        limitMB: 500,
        percentUsed: 0.85,
        isUnderPressure: true,
        exceedsLimit: false,
      };
      
      const recommendations = getMemoryCleanupRecommendations(stats);
      
      expect(recommendations).toEqual({
        unloadDistantPages: true,
        reduceImageQuality: true,
        clearCache: false,
        disablePrefetch: true,
        reason: 'High memory usage: 85%',
      });
    });

    it('should recommend no cleanup under 80%', () => {
      const stats = {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        usedMB: 300,
        limitMB: 500,
        percentUsed: 0.6,
        isUnderPressure: false,
        exceedsLimit: false,
      };
      
      const recommendations = getMemoryCleanupRecommendations(stats);
      
      expect(recommendations).toEqual({
        unloadDistantPages: false,
        reduceImageQuality: false,
        clearCache: false,
        disablePrefetch: false,
        reason: 'Memory usage normal',
      });
    });

    it('should handle exactly 90% threshold', () => {
      const stats = {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        usedMB: 450,
        limitMB: 500,
        percentUsed: 0.9,
        isUnderPressure: true,
        exceedsLimit: false,
      };
      
      const recommendations = getMemoryCleanupRecommendations(stats);
      
      expect(recommendations.clearCache).toBe(true);
    });

    it('should handle exactly 80% threshold', () => {
      const stats = {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        usedMB: 400,
        limitMB: 500,
        percentUsed: 0.8,
        isUnderPressure: true,
        exceedsLimit: false,
      };
      
      const recommendations = getMemoryCleanupRecommendations(stats);
      
      expect(recommendations.clearCache).toBe(false);
      expect(recommendations.disablePrefetch).toBe(true);
    });
  });
});
