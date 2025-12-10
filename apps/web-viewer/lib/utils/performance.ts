/**
 * Performance monitoring utilities
 * Implements FR-031: Performance degradation handling for large documents
 * Implements T103a: Performance tracking and degradation detection
 */

interface NavigationTiming {
  timestamp: number;
  duration: number;
  pageNumber: number;
}

interface PerformanceMetrics {
  recentNavigations: NavigationTiming[];
  averageNavigationTime: number;
  slowNavigationCount: number;
  isDegraded: boolean;
}

// Threshold for slow navigation (in milliseconds)
const SLOW_NAVIGATION_THRESHOLD = 1000; // 1 second

// Number of consecutive slow navigations to trigger degradation warning
const DEGRADATION_THRESHOLD = 3;

// Maximum number of navigation timings to keep
const MAX_NAVIGATION_HISTORY = 10;

/**
 * Performance monitor class
 * Tracks navigation performance and detects degradation
 */
export class PerformanceMonitor {
  private navigationHistory: NavigationTiming[] = [];
  private consecutiveSlowNavigations = 0;

  /**
   * Record a navigation timing
   */
  recordNavigation(pageNumber: number, duration: number): void {
    const timing: NavigationTiming = {
      timestamp: Date.now(),
      duration,
      pageNumber,
    };

    this.navigationHistory.push(timing);

    // Keep only recent history
    if (this.navigationHistory.length > MAX_NAVIGATION_HISTORY) {
      this.navigationHistory.shift();
    }

    // Track consecutive slow navigations
    if (duration > SLOW_NAVIGATION_THRESHOLD) {
      this.consecutiveSlowNavigations++;
    } else {
      this.consecutiveSlowNavigations = 0;
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const recentNavigations = this.navigationHistory.slice(-5);
    
    const totalDuration = recentNavigations.reduce((sum, timing) => sum + timing.duration, 0);
    const averageNavigationTime = recentNavigations.length > 0
      ? totalDuration / recentNavigations.length
      : 0;

    const slowNavigationCount = recentNavigations.filter(
      timing => timing.duration > SLOW_NAVIGATION_THRESHOLD
    ).length;

    const isDegraded = this.consecutiveSlowNavigations >= DEGRADATION_THRESHOLD;

    return {
      recentNavigations,
      averageNavigationTime,
      slowNavigationCount,
      isDegraded,
    };
  }

  /**
   * Check if performance is degraded
   */
  isDegraded(): boolean {
    return this.consecutiveSlowNavigations >= DEGRADATION_THRESHOLD;
  }

  /**
   * Reset performance metrics
   */
  reset(): void {
    this.navigationHistory = [];
    this.consecutiveSlowNavigations = 0;
  }

  /**
   * Get navigation duration statistics
   */
  getStatistics() {
    if (this.navigationHistory.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        count: 0,
      };
    }

    const durations = this.navigationHistory.map(t => t.duration);
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;

    return {
      min,
      max,
      avg,
      count: durations.length,
    };
  }
}

/**
 * Global performance monitor instance
 */
let performanceMonitor: PerformanceMonitor | null = null;

/**
 * Get or create the global performance monitor
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

/**
 * Measure async operation duration
 */
export async function measureAsync<T>(
  operation: () => Promise<T>,
  onComplete?: (duration: number) => void
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    
    if (onComplete) {
      onComplete(duration);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    if (onComplete) {
      onComplete(duration);
    }
    
    throw error;
  }
}

/**
 * Check if document size should trigger warning (FR-031a-b)
 * @param pageCount - Total number of pages in document
 * @returns Warning level: null (no warning), 'warning' (200-500 pages), 'blocking' (>500 pages)
 */
export function checkDocumentSizeWarning(pageCount: number): 'warning' | 'blocking' | null {
  if (pageCount > 500) {
    return 'blocking';
  }
  if (pageCount >= 200) {
    return 'warning';
  }
  return null;
}

/**
 * Get performance degradation message (FR-031c)
 */
export function getPerformanceDegradationMessage(metrics: PerformanceMetrics): string | null {
  if (!metrics.isDegraded) {
    return null;
  }

  return `Performance degraded: Navigation taking ${Math.round(metrics.averageNavigationTime)}ms on average. ` +
         `Consider reducing document size or closing other applications.`;
}

/**
 * Performance optimization suggestions based on metrics (FR-031d)
 */
export interface PerformanceOptimization {
  reducePrefetch: boolean;
  disableSmoothScroll: boolean;
  lowerPdfQuality: boolean;
  reason: string;
}

/**
 * Get recommended performance optimizations
 */
export function getPerformanceOptimizations(
  pageCount: number,
  metrics: PerformanceMetrics
): PerformanceOptimization | null {
  // Large document (>200 pages) or degraded performance
  if (pageCount >= 200 || metrics.isDegraded) {
    return {
      reducePrefetch: pageCount >= 200,
      disableSmoothScroll: metrics.averageNavigationTime > 500,
      lowerPdfQuality: metrics.averageNavigationTime > 1000,
      reason: pageCount >= 200 
        ? `Document has ${pageCount} pages` 
        : 'Performance degradation detected',
    };
  }

  return null;
}
