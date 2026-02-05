'use client';

import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import dynamic from 'next/dynamic';
import { useViewerStore } from '@/lib/stores/useViewerStore';
import type { ZoomMode } from '@/lib/schemas/viewer';

// Dynamically import PdfPane to avoid SSR issues with react-pdf (T101)
const PdfPane = dynamic(() => import('./PdfPane').then((mod) => mod.PdfPane), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading PDF viewer...</div>
    </div>
  ),
});

// Dynamically import MarkdownPane for code splitting (T101)
const MarkdownPane = dynamic(() => import('./MarkdownPane').then((mod) => mod.MarkdownPane), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading markdown viewer...</div>
    </div>
  ),
});

/**
 * PaneContainer component
 * Manages 2-pane or 3-pane layout with resizable dividers
 * Implements FR-004: Pane synchronization (all panes show same page)
 * Implements FR-005: Two display modes (2-pane, 3-pane)
 * Implements FR-017: Pane width adjustment (20%-80%, draggable divider, 60fps)
 */

interface PaneContainerProps {
  documentId: string;
  currentPage: number;
  languageCode: string;
  sourceLanguageCode?: string;
  targetLanguageCode?: string;
  availableLanguages?: Array<{
    languageCode: string;
    isRaw: boolean;
    label?: string;
  }>;
  className?: string;
}

export function PaneContainer({
  documentId,
  currentPage,
  languageCode,
  sourceLanguageCode,
  targetLanguageCode,
  availableLanguages = [],
  className = '',
}: PaneContainerProps) {
  const { panes, updatePaneWidth, setPaneLanguage, setPaneZoom } = useViewerStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizePaneIndex, setResizePaneIndex] = useState<number | null>(null);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, paneIndex: number) => {
    e.preventDefault();
    setResizing(true);
    setResizeStartX(e.clientX);
    setResizePaneIndex(paneIndex);
  }, []);

  // Handle resize move
  useEffect(() => {
    if (!resizing || resizePaneIndex === null || !containerRef.current) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const deltaX = e.clientX - resizeStartX;
      const deltaPercent = (deltaX / containerWidth) * 100;

      // Get current pane widths
      const currentPane = panes[resizePaneIndex];
      const nextPane = panes[resizePaneIndex + 1];

      if (!currentPane || !nextPane) return;

      // Calculate new widths
      let newCurrentWidth = currentPane.widthPercent + deltaPercent;
      let newNextWidth = nextPane.widthPercent - deltaPercent;

      // Enforce minimum width of 10% (FR-017)
      newCurrentWidth = Math.max(10, Math.min(80, newCurrentWidth));
      newNextWidth = Math.max(10, Math.min(80, newNextWidth));

      // Update pane widths
      updatePaneWidth(currentPane.id, newCurrentWidth);
      updatePaneWidth(nextPane.id, newNextWidth);

      setResizeStartX(e.clientX);
    };

    const handleMouseUp = () => {
      setResizing(false);
      setResizePaneIndex(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, resizePaneIndex, resizeStartX, panes, updatePaneWidth]);

  // Render pane content based on type
  const renderPane = useCallback((pane: typeof panes[0]) => {
    if (pane.contentType === 'pdf') {
      // Zoom handler for PDF pane
      const handleZoomChange = (level: number, mode: ZoomMode) => {
        setPaneZoom(pane.id, level, mode);
      };

      return (
        <div key={pane.id} data-testid="pdf-pane" className="h-full">
          <PdfPane
            documentId={documentId}
            pageNumber={currentPage}
            zoomLevel={pane.zoomLevel}
            zoomMode={pane.zoomMode}
            onZoomChange={handleZoomChange}
            className="h-full"
          />
        </div>
      );
    } else if (pane.contentType === 'markdown') {
      // Determine which language code to use based on pane configuration
      // Priority: user-selected language > 3-pane defaults > fallback language
      let paneLanguageCode: string;
      const paneIsRaw = pane.isRaw || false;
      
      if (pane.languageCode) {
        // User has explicitly selected a language for this pane
        paneLanguageCode = pane.languageCode;
      } else if (pane.isRaw && sourceLanguageCode) {
        // For 3-pane mode raw pane, use source language as default
        paneLanguageCode = sourceLanguageCode;
      } else if (!pane.isRaw && targetLanguageCode) {
        // For 3-pane mode processed pane, use target language as default
        paneLanguageCode = targetLanguageCode;
      } else {
        // Fallback to default language
        paneLanguageCode = languageCode;
      }

      // Handler for language change
      const handleLanguageChange = (newLanguageCode: string, newIsRaw: boolean) => {
        setPaneLanguage(pane.id, newLanguageCode, newIsRaw);
      };
      
      return (
        <div key={pane.id} data-testid="markdown-pane" className="h-full">
          <MarkdownPane
            documentId={documentId}
            pageNumber={currentPage}
            languageCode={paneLanguageCode}
            isRaw={paneIsRaw}
            availableLanguages={availableLanguages}
            onLanguageChange={handleLanguageChange}
            className="h-full"
          />
        </div>
      );
    }
    return null;
  }, [documentId, currentPage, languageCode, sourceLanguageCode, targetLanguageCode, availableLanguages, setPaneLanguage, setPaneZoom, zoomIn, zoomOut]);

  return (
    <div
      ref={containerRef}
      className={`pane-container flex h-full ${className}`}
      role="region"
      aria-label="Document viewer panes"
    >
      {panes.map((pane, index) => {
        if (!pane.visible) return null;

        const isLastPane = index === panes.length - 1;

        return (
          <Fragment key={pane.id}>
            {/* Pane */}
            <div
              className="pane relative overflow-hidden"
              style={{ width: `${pane.widthPercent}%` }} // Dynamic width from store state
              data-pane-id={pane.id}
              data-pane-type={pane.contentType}
            >
              {renderPane(pane)}
            </div>

            {/* Resizable divider */}
            {!isLastPane && (
              <div
                data-testid="pane-divider"
                className="divider relative w-1 cursor-col-resize bg-border hover:bg-primary transition-colors"
                onMouseDown={(e) => handleResizeStart(e, index)}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize panes"
                title="Drag to resize panes"
              >
                <div className="absolute inset-y-0 -left-1 -right-1 z-10" />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
