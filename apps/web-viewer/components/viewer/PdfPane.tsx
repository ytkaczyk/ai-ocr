'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import type { PDFPageProxy } from 'pdfjs-dist';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import {
  calculatePdfScale,
  formatPdfDimensions,
  isNonStandardPdfSize,
  getPdfOrientation,
} from '@/lib/utils/pdf-renderer';

// Configure PDF.js worker
import '@/lib/utils/pdf-worker';

// Import react-pdf CSS for text and annotation layers
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

/**
 * PdfPane component
 * Displays a single page of a PDF document
 * Implements FR-001: PDF rendering with device pixel ratio and aspect ratio maintenance
 * Implements FR-029: Non-standard PDF handling (page sizes, orientations, high-res)
 */

interface PdfPaneProps {
  documentId: string;
  pageNumber: number;
  onLoadSuccess?: (pageCount: number) => void;
  onLoadError?: (error: Error) => void;
  className?: string;
}

export function PdfPane({
  documentId,
  pageNumber,
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset high-res state when page changes
  useEffect(() => {
    // Use queueMicrotask to avoid React's setState-in-effect warning
    queueMicrotask(() => setHighResReady(false));
  }, [pageNumber]);

  // PDF URL
  const pdfUrl = `/api/documents/${documentId}/pages/${pageNumber}/pdf`;

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
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

  // Handle document load error
  function onDocumentLoadError(err: Error) {
    console.error('PDF load error:', err);
    setError('Cannot render PDF (file may be corrupted). Please check the file or contact support.');
    setLoading(false);
    if (onLoadError) {
      onLoadError(err);
    }
  }

  // Handle page load success
  function onPageLoadSuccess(page: PDFPageProxy) {
    const viewport = page.getViewport({ scale: 1 });
    setPageDimensions({
      width: viewport.width,
      height: viewport.height,
    });
    
    // Mark high-res as ready after low-res loads (FR-029d)
    setTimeout(() => setHighResReady(true), 100);
  }

  // Calculate scale for rendering (FR-029d: progressive loading)
  // Start with lower resolution (0.5x), then switch to full resolution
  const baseScale = containerWidth && pageDimensions
    ? calculatePdfScale(containerWidth, pageDimensions.width)
    : 1;
  
  const scale = highResReady ? baseScale : baseScale * 0.5;

  // Check for non-standard dimensions
  const isNonStandard = pageDimensions
    ? isNonStandardPdfSize(pageDimensions.width, pageDimensions.height)
    : false;

  const orientation = pageDimensions
    ? getPdfOrientation(pageDimensions.width, pageDimensions.height)
    : null;

  return (
    <div ref={containerRef} className={`pdf-pane relative h-full w-full overflow-auto ${className}`}>
      {/* Loading state */}
      {loading && !error && (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading PDF...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex h-full items-center justify-center p-4">
          <div className="text-center max-w-md">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <p className="mt-4 text-sm text-destructive font-medium">Error loading PDF</p>
            <p className="mt-2 text-xs text-muted-foreground">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
              }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* PDF Document */}
      {!error && (
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          error={null}
          className="pdf-document"
        >
          {/* Non-standard PDF warning (FR-029a) */}
          {isNonStandard && pageDimensions && (
            <div className="sticky top-0 z-10 bg-amber-50 border-b border-amber-200 px-4 py-2">
              <div className="flex items-center gap-2 text-xs text-amber-900">
                <Info className="h-4 w-4" />
                <span>
                  Non-standard page size: {formatPdfDimensions(pageDimensions.width, pageDimensions.height)}
                  {orientation && ` (${orientation})`}
                </span>
              </div>
            </div>
          )}

          {/* PDF Page with dimension tooltip (FR-029a) */}
          <div title={pageDimensions ? formatPdfDimensions(pageDimensions.width, pageDimensions.height) : undefined}>
            <Page
              pageNumber={pageNumber}
              width={containerWidth || undefined}
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
  );
}
