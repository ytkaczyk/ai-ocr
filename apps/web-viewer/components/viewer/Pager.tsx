'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { throttle, DEBOUNCE_NAVIGATION } from '@/lib/utils/debounce';

/**
 * Pager component
 * Navigation controls for page transitions and PDF zoom
 * Implements FR-003: Pager control with next/previous/jump navigation
 * Implements FR-012: Page number and total page count display
 * Implements FR-013: Navigation bounds (prevent negative/beyond-length navigation)
 * Implements FR-015: Keyboard shortcuts (arrow keys, page up/down)
 * Implements FR-016: PDF zoom controls (10% increments, fit, width modes)
 */

interface PagerProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  disabled?: boolean;
}

export function Pager({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  disabled = false,
}: PagerProps) {
  const [jumpValue, setJumpValue] = useState(currentPage.toString());
  
  // Store onPageChange in a ref so we always call the latest version
  const onPageChangeRef = useRef(onPageChange);
  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);
  
  // Create throttled function in useEffect to avoid ref access during render (FR-024a: 100ms)
  // Note: Using throttle instead of debounce for responsive navigation
  // Throttle executes immediately then prevents rapid-fire calls
  const throttledPageChangeRef = useRef<((page: number) => void) | null>(null);
  
  useEffect(() => {
    throttledPageChangeRef.current = throttle((page: number) => {
      onPageChangeRef.current(page);
    }, DEBOUNCE_NAVIGATION);
  }, []); // Empty deps - create throttle only once
  
  const throttledPageChange = useCallback((page: number) => {
    throttledPageChangeRef.current?.(page);
  }, []);

  // Update jump value when current page changes
  useEffect(() => {
    setJumpValue(currentPage.toString());
  }, [currentPage]);

  // Navigation handlers with boundary checks (FR-013) and debouncing (FR-024a)
  const goToFirstPage = useCallback(() => {
    if (currentPage > 1 && !disabled) {
      throttledPageChange(1);
    }
  }, [currentPage, disabled, throttledPageChange]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1 && !disabled) {
      throttledPageChange(currentPage - 1);
    }
  }, [currentPage, disabled, throttledPageChange]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages && !disabled) {
      throttledPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, disabled, throttledPageChange]);

  const goToLastPage = useCallback(() => {
    if (currentPage < totalPages && !disabled) {
      throttledPageChange(totalPages);
    }
  }, [currentPage, totalPages, disabled, throttledPageChange]);

  const handleJumpToPage = useCallback(() => {
    const page = parseInt(jumpValue, 10);
    
    // Validate page number (FR-013)
    if (isNaN(page) || page < 1 || page > totalPages) {
      // Reset to current page on invalid input
      setJumpValue(currentPage.toString());
      return;
    }

    if (page !== currentPage && !disabled) {
      throttledPageChange(page);
    }
  }, [jumpValue, currentPage, totalPages, disabled, throttledPageChange]);

  // Keyboard navigation (FR-015)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPreviousPage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNextPage();
          break;
        case 'PageUp':
          e.preventDefault();
          goToPreviousPage();
          break;
        case 'PageDown':
          e.preventDefault();
          goToNextPage();
          break;
        case 'Home':
          if (e.ctrlKey) {
            e.preventDefault();
            goToFirstPage();
          }
          break;
        case 'End':
          if (e.ctrlKey) {
            e.preventDefault();
            goToLastPage();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToFirstPage, goToPreviousPage, goToNextPage, goToLastPage]);

  return (
    <div
      data-testid="pager"
      className={`pager flex items-center justify-center gap-4 px-4 py-3 border-b bg-background ${className}`}
      role="navigation"
      aria-label="Page navigation"
    >
      {/* Page navigation and display */}
      <div className="flex items-center gap-2">
        <Button
          data-testid="pager-first"
          variant="ghost"
          size="icon"
          onClick={goToFirstPage}
          disabled={disabled || currentPage === 1}
          aria-label="Go to first page"
          title="First page (Ctrl+Home)"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          data-testid="pager-prev"
          variant="ghost"
          size="icon"
          onClick={goToPreviousPage}
          disabled={disabled || currentPage === 1}
          aria-label="Go to previous page"
          title="Previous page (←, Page Up)"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page number display and jump input (FR-012) */}
        <div data-testid="page-display" className="flex items-center gap-2 text-sm" aria-label={`Page ${currentPage} of ${totalPages}`}>
          <span className="sr-only">Page {currentPage} of {totalPages}</span>
          <span className="text-muted-foreground">Page</span>
          <input
            data-testid="pager-input"
            type="number"
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onBlur={handleJumpToPage}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleJumpToPage();
              }
            }}
            min={1}
            max={totalPages}
            disabled={disabled}
            className="w-16 rounded border border-input bg-background px-2 py-1 text-center text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Jump to page"
          />
          <span className="text-muted-foreground">of {totalPages}</span>
        </div>

        <Button
          data-testid="pager-next"
          variant="ghost"
          size="icon"
          onClick={goToNextPage}
          disabled={disabled || currentPage === totalPages}
          aria-label="Go to next page"
          title="Next page (→, Page Down)"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          data-testid="pager-last"
          variant="ghost"
          size="icon"
          onClick={goToLastPage}
          disabled={disabled || currentPage === totalPages}
          aria-label="Go to last page"
          title="Last page (Ctrl+End)"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Right: Keyboard shortcuts hint */}
      <div className="text-xs text-muted-foreground hidden lg:block">
        Use ← → or Page Up/Down
      </div>
    </div>
  );
}
