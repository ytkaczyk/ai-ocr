'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { debounce, DEBOUNCE_NAVIGATION } from '@/lib/utils/debounce';
import { ZoomControls } from './ZoomControls';
import { useViewerStore } from '@/lib/stores/useViewerStore';
import type { ZoomMode } from '@/lib/schemas/viewer';

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
  const { panes, setPaneZoom, zoomIn, zoomOut } = useViewerStore();
  
  // Get PDF pane zoom state
  const pdfPane = panes.find(p => p.contentType === 'pdf');
  const zoomLevel = pdfPane?.zoomLevel ?? 1;
  const zoomMode = pdfPane?.zoomMode ?? 'fit';
  
  // Debounced page change handler (FR-024a: 100ms)
  const debouncedPageChangeRef = useRef(
    debounce((page: number) => onPageChange(page), DEBOUNCE_NAVIGATION)
  );

  // Update debounced function when onPageChange changes
  useEffect(() => {
    debouncedPageChangeRef.current = debounce((page: number) => onPageChange(page), DEBOUNCE_NAVIGATION);
  }, [onPageChange]);

  // Update jump value when current page changes
  useEffect(() => {
    setJumpValue(currentPage.toString());
  }, [currentPage]);

  // Navigation handlers with boundary checks (FR-013) and debouncing (FR-024a)
  const goToFirstPage = useCallback(() => {
    if (currentPage > 1 && !disabled) {
      debouncedPageChangeRef.current(1);
    }
  }, [currentPage, disabled]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1 && !disabled) {
      debouncedPageChangeRef.current(currentPage - 1);
    }
  }, [currentPage, disabled]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages && !disabled) {
      debouncedPageChangeRef.current(currentPage + 1);
    }
  }, [currentPage, totalPages, disabled]);

  const goToLastPage = useCallback(() => {
    if (currentPage < totalPages && !disabled) {
      debouncedPageChangeRef.current(totalPages);
    }
  }, [currentPage, totalPages, disabled]);

  const handleJumpToPage = useCallback(() => {
    const page = parseInt(jumpValue, 10);
    
    // Validate page number (FR-013)
    if (isNaN(page) || page < 1 || page > totalPages) {
      // Reset to current page on invalid input
      setJumpValue(currentPage.toString());
      return;
    }

    if (page !== currentPage && !disabled) {
      debouncedPageChangeRef.current(page);
    }
  }, [jumpValue, currentPage, totalPages, disabled]);

  // Zoom handlers (FR-016)
  const handleZoomIn = useCallback(() => {
    if (pdfPane) {
      zoomIn(pdfPane.id);
    }
  }, [pdfPane, zoomIn]);

  const handleZoomOut = useCallback(() => {
    if (pdfPane) {
      zoomOut(pdfPane.id);
    }
  }, [pdfPane, zoomOut]);

  const handleZoomChange = useCallback((level: number, mode: ZoomMode) => {
    if (pdfPane) {
      setPaneZoom(pdfPane.id, level, mode);
    }
  }, [pdfPane, setPaneZoom]);

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
      className={`pager flex items-center justify-between gap-4 px-4 py-3 border-b bg-background ${className}`}
      role="navigation"
      aria-label="Page navigation"
    >
      {/* Left: Zoom controls for PDF (FR-016) */}
      <div className="flex items-center gap-2">
        {pdfPane && (
          <ZoomControls
            zoomLevel={zoomLevel}
            zoomMode={zoomMode}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomChange={handleZoomChange}
            disabled={disabled}
          />
        )}
      </div>

      {/* Center: Page navigation and display */}
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
        <div data-testid="page-display" className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Page</span>
          <input
            data-testid="page-jump-input"
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
