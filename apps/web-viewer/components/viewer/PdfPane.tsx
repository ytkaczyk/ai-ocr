'use client';

import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Document, Page } from 'react-pdf';
import type { PageCallback } from 'react-pdf/dist/shared/types.js';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import {
  formatPdfDimensions,
  isNonStandardPdfSize,
  getPdfOrientation,
} from '@/lib/utils/pdf-renderer';
import type { ZoomMode } from '@/lib/schemas/viewer';
import { PdfToolbar } from './PdfToolbar';

// Configure PDF.js worker
import '@/lib/utils/pdf-worker';

// Import react-pdf CSS for text and annotation layers
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

/**
 * PdfPane component
 * Displays a single page of a PDF document
 * Implements FR-001: PDF rendering with device pixel ratio and aspect ratio maintenance
 * Implements FR-016: PDF zoom controls (10% increments, fit, width modes)
 * Implements FR-029: Non-standard PDF handling (page sizes, orientations, high-res)
 * Implements T100: React.memo optimization to prevent unnecessary re-renders
 */

interface PdfPaneProps {
  documentId: string;
  pageNumber: number;
  zoomLevel?: number;
  zoomMode?: ZoomMode;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomChange?: (level: number, mode: ZoomMode) => void;
  onLoadSuccess?: (pageCount: number) => void;
  onLoadError?: (error: Error) => void;
  className?: string;
}

function PdfPaneComponent({
  documentId,
  pageNumber,
  zoomLevel = 1,
  zoomMode = 'fit',
  onZoomIn,
  onZoomOut,
  onZoomChange,
  onLoadSuccess,
  onLoadError,
  className = '',
}: PdfPaneProps) {
  const [_numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [highResReady, setHighResReady] = useState(false);
  const [containerHeight, setContainerHeight] = useState<number>(600);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset high-res state when page changes
  useEffect(() => {
    // Use queueMicrotask to avoid React's setState-in-effect warning
    queueMicrotask(() => setHighResReady(false));
  }, [pageNumber]);

  // PDF URL - same for all pages, enabling efficient browser caching
  const pdfUrl = `/api/documents/${documentId}/pdf`;

  // Handle HTTP errors (e.g., 422 for corrupted PDFs)
  const httpSource = useMemo(() => ({
    url: pdfUrl,
    httpHeaders: {},
    withCredentials: false,
  }), [pdfUrl]);

  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle document load success
  function onDocumentLoadSuccess({ numPages: pages }: { numPages: number }) {
    setNumPages(pages);
    setLoading(false);
    setError(null);
    if (onLoadSuccess) {
      onLoadSuccess(pages);
    }
  }

  // Handle document load error (FR-011b)
  function onDocumentLoadError(err: Error) {
    console.error('PDF load error:', err);
    
    // Check if this is an HTTP error from the API
    const errorMessage = err.message || '';
    if (errorMessage.includes('422') || errorMessage.includes('Unprocessable')) {
      setError('Cannot render PDF (file may be corrupted). Please verify the PDF file and re-scan if necessary.');
    } else {
      setError('Cannot render PDF (file may be corrupted). Please verify the PDF file and re-scan if necessary.');
    }
    
    setLoading(false);
    if (onLoadError) {
      onLoadError(err);
    }
  }

  // Handle page load success
  function onPageLoadSuccess(page: PageCallback) {
    const viewport = page.getViewport({ scale: 1 });
    setPageDimensions({
      width: viewport.width,
      height: viewport.height,
    });
    
    // Mark high-res as ready after low-res loads (FR-029d)
    setTimeout(() => setHighResReady(true), 100);
  }

  // Calculate scale based on zoom mode (FR-016)
  const scale = useMemo(() => {
    if (!containerWidth || !pageDimensions) {
      return 1;
    }

    let baseScale: number;

    switch (zoomMode) {
      case 'fit': {
        // Scale to fit entire page in container
        const widthScale = containerWidth / pageDimensions.width;
        const heightScale = containerHeight / pageDimensions.height;
        baseScale = Math.min(widthScale, heightScale) * 0.95; // 95% to add padding
        break;
      }
      case 'width': {
        // Scale to fit page width to container width
        baseScale = (containerWidth / pageDimensions.width) * 0.98; // 98% to add small padding
        break;
      }
      case 'percentage':
      default: {
        // Use manual zoom level
        baseScale = zoomLevel;
        break;
      }
    }

    // Progressive loading: start with lower resolution, then switch to full
    return highResReady ? baseScale : baseScale * 0.5;
  }, [containerWidth, containerHeight, pageDimensions, zoomMode, zoomLevel, highResReady]);

  // Check for non-standard dimensions
  const isNonStandard = pageDimensions
    ? isNonStandardPdfSize(pageDimensions.width, pageDimensions.height)
    : false;

  const orientation = pageDimensions
    ? getPdfOrientation(pageDimensions.width, pageDimensions.height)
    : null;

  return (
    <div className={`pdf-pane relative flex flex-col h-full bg-background ${className}`} role="region" aria-label="PDF viewer pane">
      {/* Toolbar with zoom controls */}
      {onZoomIn && onZoomOut && onZoomChange && (
        <PdfToolbar
          zoomLevel={zoomLevel}
          zoomMode={zoomMode}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomChange={onZoomChange}
          disabled={loading || !!error}
        />
      )}

      {/* Scrollable PDF container */}
      <div ref={containerRef} className="flex-1 overflow-auto">
      {/* Loading state */}
      {loading && !error && (
        <div className="flex h-full items-center justify-center" role="status" aria-live="polite" aria-label="Loading PDF">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <p className="mt-2 text-sm text-muted-foreground">Loading PDF...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div data-testid="error-message" className="flex h-full items-center justify-center p-4" role="alert" aria-live="assertive">
          <div className="text-center max-w-md">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" aria-hidden="true" />
            <p className="mt-4 text-sm text-destructive font-medium">Error loading PDF</p>
            <p className="mt-2 text-xs text-muted-foreground">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
              }}
              className="mt-4 text-sm text-primary hover:underline"
              aria-label="Retry loading PDF"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* PDF Document */}
      {!error && (
        <Document
          key={documentId}
          file={httpSource}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          error={null}
          className="pdf-document"
        >
          {/* Non-standard PDF warning (FR-029a) */}
          {isNonStandard && pageDimensions && (
            <div className="sticky top-0 z-10 bg-amber-50 border-b border-amber-200 px-4 py-2" role="status" aria-label="Non-standard page size warning">
              <div className="flex items-center gap-2 text-xs text-amber-900">
                <Info className="h-4 w-4" aria-hidden="true" />
                <span>
                  Non-standard page size: {formatPdfDimensions(pageDimensions.width, pageDimensions.height)}
                  {orientation && ` (${orientation})`}
                </span>
              </div>
            </div>
          )}

          {/* PDF Page with dimension tooltip (FR-029a) */}
          <div 
            title={pageDimensions ? formatPdfDimensions(pageDimensions.width, pageDimensions.height) : undefined}
            aria-label={`PDF page ${pageNumber}`}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              onLoadSuccess={onPageLoadSuccess}
              loading={
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            }
            error={
              <div className="flex items-center justify-center p-8 text-destructive">
                <AlertCircle className="mr-2 h-5 w-5" />
                <span className="text-sm">Failed to render page {pageNumber}</span>
              </div>
            }
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="pdf-page mx-auto"
          />
          </div>
        </Document>
      )}
      </div>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders (T100)
// Only re-render if documentId, pageNumber, zoomLevel, or zoomMode changes
export const PdfPane = memo(PdfPaneComponent, (prevProps, nextProps) => {
  return (
    prevProps.documentId === nextProps.documentId &&
    prevProps.pageNumber === nextProps.pageNumber &&
    prevProps.zoomLevel === nextProps.zoomLevel &&
    prevProps.zoomMode === nextProps.zoomMode &&
    prevProps.onZoomIn === nextProps.onZoomIn &&
    prevProps.onZoomOut === nextProps.onZoomOut &&
    prevProps.onZoomChange === nextProps.onZoomChange
  );
});

PdfPane.displayName = 'PdfPane';
