'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Monitor } from 'lucide-react';
import { getViewportSize, getViewportSizeName, createViewportListener } from '@/lib/utils/viewport';

/**
 * ViewportWarning component
 * Displays warnings for tablet and mobile viewports
 * Implements FR-025c and FR-025d: Device-appropriate UX warnings
 */

export function ViewportWarning() {
  const [viewportSize, setViewportSize] = useState<ReturnType<typeof getViewportSize>>('large-desktop');
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Update viewport size on resize
    const cleanup = createViewportListener(setViewportSize);
    return cleanup;
  }, []);

  // Reset dismissal when viewport size changes
  useEffect(() => {
    queueMicrotask(() => setIsDismissed(false));
  }, [viewportSize]);

  // Don't show warning for desktop sizes
  if (viewportSize === 'desktop' || viewportSize === 'large-desktop') {
    return null;
  }

  // Don't show if dismissed
  if (isDismissed) {
    return null;
  }

  // Mobile: Block usage (FR-025d)
  if (viewportSize === 'mobile') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
        <div className="max-w-md space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Monitor className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Desktop Required</h2>
          <p className="text-muted-foreground">
            The OCR Translation Comparison Viewer requires a desktop screen (minimum 1024px width)
            for optimal side-by-side document comparison.
          </p>
          <p className="text-sm text-muted-foreground">
            Current viewport: {getViewportSizeName(viewportSize)}
          </p>
          <p className="text-sm text-muted-foreground">
            Please switch to a desktop device or increase your browser window size.
          </p>
        </div>
      </div>
    );
  }

  // Tablet: Warning banner (FR-025c)
  if (viewportSize === 'tablet') {
    return (
      <div className="fixed top-0 left-0 right-0 z-40 bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-200 dark:border-yellow-800">
        <div className="container mx-auto flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Limited Experience on Tablet
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
                For the best side-by-side comparison experience, we recommend using a desktop (≥1024px).
                Current viewport: {getViewportSizeName(viewportSize)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="flex-shrink-0 rounded-md p-1.5 text-yellow-600 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            aria-label="Dismiss warning"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
