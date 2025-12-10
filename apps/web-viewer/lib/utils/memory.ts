/**
 * Memory management utilities
 * Implements FR-032: Memory consumption limits and pressure detection
 * Implements T103e-h: Memory monitoring and management
 */

// Default memory limit: 500MB (configurable via environment variable)
const DEFAULT_MEMORY_LIMIT_MB = 500;

// Memory pressure threshold: 80% of limit
const MEMORY_PRESSURE_THRESHOLD = 0.8;

// Monitoring interval: 30 seconds
const MONITORING_INTERVAL_MS = 30000;

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedMB: number;
  limitMB: number;
  percentUsed: number;
  isUnderPressure: boolean;
  exceedsLimit: boolean;
}

/**
 * Memory manager class
 * Monitors memory usage and triggers cleanup when needed
 */
export class MemoryManager {
  private memoryLimitMB: number;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private cleanupCallbacks: Array<() => void> = [];
  private lastStats: MemoryStats | null = null;

  constructor(memoryLimitMB?: number) {
    // Get memory limit from environment or use default (FR-032a)
    this.memoryLimitMB = memoryLimitMB || 
                         parseInt(process.env.MEMORY_LIMIT_MB || '', 10) || 
                         DEFAULT_MEMORY_LIMIT_MB;
  }

  /**
   * Start monitoring memory usage (FR-032b)
   */
  startMonitoring(): void {
    if (typeof window === 'undefined' || !('performance' in window)) {
      console.warn('Memory monitoring not available in this environment');
      return;
    }

    // Check every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkMemory();
    }, MONITORING_INTERVAL_MS);

    // Initial check
    this.checkMemory();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Register a cleanup callback
   */
  onMemoryPressure(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Get current memory statistics
   */
  getStats(): MemoryStats | null {
    if (typeof window === 'undefined' || 
        !('performance' in window) || 
        !('memory' in performance)) {
      return null;
    }

    const memory = (performance as Performance & { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    const usedMB = memory.usedJSHeapSize / (1024 * 1024);
    const limitMB = this.memoryLimitMB;
    const percentUsed = usedMB / limitMB;

    const stats: MemoryStats = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedMB,
      limitMB,
      percentUsed,
      isUnderPressure: percentUsed >= MEMORY_PRESSURE_THRESHOLD,
      exceedsLimit: usedMB >= limitMB,
    };

    this.lastStats = stats;
    return stats;
  }

  /**
   * Check memory and trigger cleanup if needed
   */
  private checkMemory(): void {
    const stats = this.getStats();
    
    if (!stats) {
      return;
    }

    // Trigger cleanup if memory pressure detected (FR-032b: 80% threshold)
    if (stats.isUnderPressure) {
      console.warn(`Memory pressure detected: ${Math.round(stats.percentUsed * 100)}% used (${Math.round(stats.usedMB)}MB / ${stats.limitMB}MB)`);
      this.triggerCleanup();
    }

    // Memory limit exceeded (FR-032c)
    if (stats.exceedsLimit) {
      console.error(`Memory limit exceeded: ${Math.round(stats.usedMB)}MB / ${stats.limitMB}MB`);
    }
  }

  /**
   * Trigger cleanup callbacks
   */
  private triggerCleanup(): void {
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in cleanup callback:', error);
      }
    });
  }

  /**
   * Get last recorded stats
   */
  getLastStats(): MemoryStats | null {
    return this.lastStats;
  }

  /**
   * Check if memory limit is exceeded
   */
  isMemoryExceeded(): boolean {
    const stats = this.getStats();
    return stats ? stats.exceedsLimit : false;
  }

  /**
   * Check if under memory pressure
   */
  isUnderPressure(): boolean {
    const stats = this.getStats();
    return stats ? stats.isUnderPressure : false;
  }
}

/**
 * Global memory manager instance
 */
let memoryManager: MemoryManager | null = null;

/**
 * Get or create the global memory manager
 */
export function getMemoryManager(): MemoryManager {
  if (!memoryManager) {
    memoryManager = new MemoryManager();
  }
  return memoryManager;
}

/**
 * Image optimization for high-resolution images (FR-032d)
 */
export interface ImageOptimization {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

/**
 * Get recommended image optimization settings based on memory pressure
 */
export function getImageOptimization(memoryPressure: boolean): ImageOptimization {
  if (memoryPressure) {
    // Aggressive optimization under memory pressure
    return {
      maxWidth: 2000,
      maxHeight: 2000,
      quality: 70,
    };
  }

  // Normal optimization
  return {
    maxWidth: 4000,
    maxHeight: 4000,
    quality: 85,
  };
}

/**
 * Calculate estimated memory usage for a PDF page
 */
export function estimatePageMemoryMB(width: number, height: number, scale: number = 1): number {
  // Rough estimate: 4 bytes per pixel (RGBA)
  const pixels = width * height * scale * scale;
  const bytes = pixels * 4;
  return bytes / (1024 * 1024);
}

/**
 * Check if image should be lazy loaded based on distance from current page
 */
export function shouldLazyLoadImage(currentPage: number, imagePage: number, threshold: number = 5): boolean {
  const distance = Math.abs(imagePage - currentPage);
  return distance > threshold;
}

/**
 * Get memory cleanup recommendations
 */
export interface MemoryCleanupRecommendation {
  unloadDistantPages: boolean;
  reduceImageQuality: boolean;
  clearCache: boolean;
  disablePrefetch: boolean;
  reason: string;
}

/**
 * Get cleanup recommendations based on memory stats
 */
export function getMemoryCleanupRecommendations(stats: MemoryStats): MemoryCleanupRecommendation {
  const percentUsed = stats.percentUsed * 100;

  if (percentUsed >= 90) {
    return {
      unloadDistantPages: true,
      reduceImageQuality: true,
      clearCache: true,
      disablePrefetch: true,
      reason: `Critical memory usage: ${Math.round(percentUsed)}%`,
    };
  }

  if (percentUsed >= 80) {
    return {
      unloadDistantPages: true,
      reduceImageQuality: true,
      clearCache: false,
      disablePrefetch: true,
      reason: `High memory usage: ${Math.round(percentUsed)}%`,
    };
  }

  return {
    unloadDistantPages: false,
    reduceImageQuality: false,
    clearCache: false,
    disablePrefetch: false,
    reason: 'Memory usage normal',
  };
}
