'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useDocumentStore } from '@/lib/stores/useDocumentStore';
import { useViewerStore } from '@/lib/stores/useViewerStore';
import { Pager } from './Pager';
import { PaneContainer } from './PaneContainer';
import { ModeToggle } from './ModeToggle';
import { ScreenReaderAnnouncement } from './ScreenReaderAnnouncement';
import { Loader2, AlertCircle } from 'lucide-react';
import { prefetchAdjacentPagesWithCache } from '@/lib/utils/prefetch';

/**
 * Viewer component
 * Main container for document viewing with panes and navigation
 * Implements FR-004: Pane synchronization
 * Implements FR-012: Page number and total page count display
 * Implements T106: Screen reader announcements for page changes
 */

interface ViewerProps {
  documentId?: string;
  className?: string;
}

export function Viewer({ documentId, className = '' }: ViewerProps) {
  const { documents, getCurrentDocument, currentDocumentId } = useDocumentStore();
  const { currentPage, setCurrentPage, setError, error, paneMode, panes } = useViewerStore();
  const [totalPages, setTotalPages] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const previousDocumentIdRef = useRef<string | null>(null);
  const previousPaneModeRef = useRef<string>(paneMode);
  const previousPageRef = useRef<number>(currentPage);

  // Get document ID from props or store
  const activeDocumentId = documentId || currentDocumentId;

  // Find the document
  const document = activeDocumentId 
    ? documents.find((doc) => doc.id === activeDocumentId) || getCurrentDocument()
    : getCurrentDocument();

  // Derive loading state - we're loading if we have an active ID but no document
  const loading = !!activeDocumentId && !document;

  // Initialize page from URL query parameter when document loads
  useEffect(() => {
    if (typeof window === 'undefined' || !document) return;
    
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    
    if (pageParam) {
      const pageNum = parseInt(pageParam, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= document.pageCount) {
        setCurrentPage(pageNum);
      }
    }
    
    // Initialize per-pane language selections from URL (FR-034e, T097h)
    const pane1Lang = params.get('pane1Lang');
    const pane1Raw = params.get('pane1Raw') === 'true';
    const pane2Lang = params.get('pane2Lang');
    const pane2Raw = params.get('pane2Raw') === 'true';
    const pane3Lang = params.get('pane3Lang');
    const pane3Raw = params.get('pane3Raw') === 'true';
    
    // Apply language selections if valid
    const { setPaneLanguage, panes } = useViewerStore.getState();
    
    if (pane1Lang && panes[0]?.contentType === 'markdown') {
      setPaneLanguage(panes[0].id, pane1Lang, pane1Raw);
    }
    if (pane2Lang && panes[1]?.contentType === 'markdown') {
      setPaneLanguage(panes[1].id, pane2Lang, pane2Raw);
    }
    if (pane3Lang && panes[2]?.contentType === 'markdown') {
      setPaneLanguage(panes[2].id, pane3Lang, pane3Raw);
    }
  }, [document, setCurrentPage]);

  // Update URL when page, mode, or pane languages change (FR-034e, T097h)
  useEffect(() => {
    if (typeof window === 'undefined' || !document) return;
    
    // Update URL to match current page, mode, and language selections
    const updateURL = () => {
      const url = new URL(window.location.href);
      const currentPageParam = url.searchParams.get('page');
      const currentModeParam = url.searchParams.get('mode');
      const newPageValue = currentPage.toString();
      const newModeValue = paneMode;
      
      // Only update if the parameters are different
      let changed = false;
      
      if (currentPageParam !== newPageValue) {
        url.searchParams.set('page', newPageValue);
        changed = true;
      }
      
      if (currentModeParam !== newModeValue) {
        url.searchParams.set('mode', newModeValue);
        changed = true;
      }
      
      // Track language selections for markdown panes (T097h)
      const markdownPanes = panes.filter(p => p.contentType === 'markdown');
      markdownPanes.forEach((pane, idx) => {
        const paneNum = idx + 1;
        const langParam = `pane${paneNum}Lang`;
        const rawParam = `pane${paneNum}Raw`;
        
        if (pane.languageCode) {
          const currentLang = url.searchParams.get(langParam);
          const currentRaw = url.searchParams.get(rawParam);
          
          if (currentLang !== pane.languageCode) {
            url.searchParams.set(langParam, pane.languageCode);
            changed = true;
          }
          
          const rawValue = pane.isRaw ? 'true' : 'false';
          if (currentRaw !== rawValue) {
            url.searchParams.set(rawParam, rawValue);
            changed = true;
          }
        }
      });
      
      // Use replaceState to avoid creating too many history entries
      if (changed) {
        window.history.replaceState({}, '', url.toString());
      }
    };
    
    updateURL();
    
    // Handle browser back/forward navigation
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      
      if (pageParam) {
        const pageNum = parseInt(pageParam, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= document.pageCount) {
          setCurrentPage(pageNum);
        }
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPage, paneMode, panes, document, setCurrentPage]);

  // Initialize viewer with document data
  useEffect(() => {
    if (!document) {
      if (activeDocumentId) {
        queueMicrotask(() => setError('Document not found'));
      }
      return;
    }

    // Clear error and set total pages
    queueMicrotask(() => {
      if (error) {
        setError(null);
      }
      setTotalPages(document.pageCount);
    });

    // Reset to page 1 when document changes (unless URL has a page param)
    const documentChanged = previousDocumentIdRef.current !== activeDocumentId;
    
    if (documentChanged) {
      previousDocumentIdRef.current = activeDocumentId || null;
      
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      
      if (!pageParam) {
        setCurrentPage(1);
      }
    } else if (currentPage > document.pageCount) {
      // Also reset if current page exceeds new document's page count
      setCurrentPage(1);
    }
  }, [document, activeDocumentId, currentPage, setCurrentPage, setError, error]);

  // Prefetch adjacent pages whenever page changes
  useEffect(() => {
    if (!document) return;

    const languageVersion = document.availableLanguages.find((lang: { isRaw: boolean }) => !lang.isRaw) || 
                           document.availableLanguages[0];
    
    if (!languageVersion) return;

    // Prefetch N-1 and N+1 pages
    prefetchAdjacentPagesWithCache(
      document.id,
      currentPage,
      document.pageCount,
      languageVersion.languageCode
    );

    // Announce page change to screen readers (T106, FR-018)
    if (previousPageRef.current !== currentPage) {
      queueMicrotask(() => {
        setAnnouncement(`Page ${currentPage} of ${document.pageCount}`);
      });
      previousPageRef.current = currentPage;
    }
  }, [document, currentPage]);

  // Preserve page position when switching modes (T095, FR-006)
  // This is handled by the store's setPaneMode action which maintains currentPage
  useEffect(() => {
    // Track mode changes without resetting page
    if (previousPaneModeRef.current !== paneMode) {
      previousPaneModeRef.current = paneMode;
      // Page position is automatically preserved by store state
    }
  }, [paneMode]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages, setCurrentPage]);

  // Loading state
  if (loading && !document) {
    return (
      <div className={`viewer flex h-full items-center justify-center ${className}`} role="status" aria-live="polite" aria-label="Loading document">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !document) {
    return (
      <div className={`viewer flex h-full items-center justify-center ${className}`} role="alert" aria-live="assertive">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-16 w-16 text-destructive" aria-hidden="true" />
          <p className="mt-4 text-lg font-medium text-destructive">Error loading document</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {error || 'The requested document could not be found or loaded.'}
          </p>
        </div>
      </div>
    );
  }

  // Get first available language (prefer processed over raw per FR-021)
  const languageVersion = document.availableLanguages.find((lang: { isRaw: boolean }) => !lang.isRaw) || 
                         document.availableLanguages[0];

  if (!languageVersion) {
    return (
      <div className={`viewer flex h-full items-center justify-center ${className}`} role="status" aria-label="No content available">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 text-lg font-medium">No content available</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This document does not have any language versions available.
          </p>
        </div>
      </div>
    );
  }

  // Detect available language versions for 3-pane mode (T090)
  // FR-005: 3-pane mode requires at least 2 language versions
  const availableLanguageCodes = document.availableLanguages.map((lang: { languageCode: string }) => lang.languageCode);
  
  // Build list of available languages with raw/processed info for language selector
  const availableLanguagesForSelector = document.availableLanguages.map((lang: { languageCode: string; isRaw: boolean }) => ({
    languageCode: lang.languageCode,
    isRaw: lang.isRaw,
  }));
  
  // For 3-pane mode, determine source and target language codes
  // Strategy: Use raw version as source, processed version as target
  const rawVersion = document.availableLanguages.find((lang: { isRaw: boolean }) => lang.isRaw);
  const processedVersion = document.availableLanguages.find((lang: { isRaw: boolean }) => !lang.isRaw);
  
  const sourceLanguageCode = rawVersion?.languageCode || languageVersion.languageCode;
  const targetLanguageCode = processedVersion?.languageCode || languageVersion.languageCode;

  return (
    <div data-testid="viewer-container" className={`viewer flex h-full flex-col ${className}`} aria-label="Document viewer">
      {/* Screen reader announcements for page changes (T106, FR-018) */}
      <ScreenReaderAnnouncement message={announcement} priority="polite" />

      {/* Pager navigation with mode toggle */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 border-b bg-background" role="toolbar" aria-label="Document navigation and display controls">
        <ModeToggle availableLanguages={availableLanguageCodes} />
        
        <Pager
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Pane container */}
      <div className="viewer-content flex-1 overflow-hidden" role="region" aria-label="Document content panes">
        <PaneContainer
          documentId={document.id}
          currentPage={currentPage}
          languageCode={languageVersion.languageCode}
          sourceLanguageCode={sourceLanguageCode}
          targetLanguageCode={targetLanguageCode}
          availableLanguages={availableLanguagesForSelector}
        />
      </div>
    </div>
  );
}
